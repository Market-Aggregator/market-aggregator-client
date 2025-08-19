import * as signalR from "@microsoft/signalr";
import "./App.css";
import { useEffect, useState, useRef } from "react";

type StockTrade = {
  exchange: string;
  symbol: string;
  price: number;
  size: number;
  timestamp: string;
};

type Subscription = {
  exchange: string;
  symbol: string;
};

function App() {
  const [messages, setMessages] = useState<StockTrade[]>([]);
  const [exchange, setExchange] = useState("");
  const [symbol, setSymbol] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5098/trades/stock")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveTradeUpdate", (trade: StockTrade) => {
      setMessages((prev) => [...prev, trade]);
    });

    connection
      .start()
      .then(() => {
        console.log("Connected to SignalR Hub");
      })
      .catch((err) => console.error("Connection failed: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  const handleSubscribe = () => {
    if (connectionRef.current) {
      connectionRef.current
        .invoke("SubscribeToExchangeSymbol", exchange, symbol)
        .then(() => {
          console.log(`Subscribed to ${exchange}.${symbol}`);
          setSubscriptions((prev) => [...prev, { exchange, symbol }]);
        })
        .catch((err) => console.error("Subscription failed: ", err));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="App">
      <h1>Live Stock Trades</h1>

      {/* Subscription Controls */}
      <div className="controls">
        <label>
          Exchange:
          <input
            type="text"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
          />
        </label>
        <label>
          Symbol:
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </label>
        <button onClick={handleSubscribe}>Subscribe</button>
      </div>

      {/* Active Subscriptions */}
      <h2>Active Subscriptions</h2>
      <ul>
        {subscriptions.map((sub, idx) => (
          <li key={idx}>
            {sub.exchange}.{sub.symbol}
          </li>
        ))}
      </ul>

      {/* Trade Updates */}
      <h2>Trade Updates</h2>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>
            {msg.exchange}.{msg.symbol} → Price: {msg.price} | Size: {msg.size}{" "}
            | Time: {formatTimestamp(msg.timestamp)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
