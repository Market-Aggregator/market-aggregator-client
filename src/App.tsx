import * as signalR from "@microsoft/signalr";
import "./App.css";
import { useEffect, useState, useRef } from "react";

enum MarketEvents {
    Trade,
    Quote,
}

type StockTrade = {
    marketEvent: MarketEvents;
    exchange: string;
    symbol: string;
    price: number;
    size: number;
    timestamp: string;
};

type StockQuote = {
    marketEvent: MarketEvents;
    symbol: string;
    askExchange: string;
    askPrice: number;
    askSize: number;
    bidExchange: string;
    bidPrice: number;
    bidSize: number;
    timestamp: string;
};

type Subscription = {
    exchange?: string;
    symbol: string;
    type: MarketEvents;
};

function App() {
    const [trades, setTrades] = useState<StockTrade[]>([]);
    const [exchange, setExchange] = useState("");
    const [symbol, setSymbol] = useState("");

    const [quotes, setQuotes] = useState<StockQuote[]>([]);
    const [quoteSymbol, setQuoteSymbol] = useState("");

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5098/stock")
            .withAutomaticReconnect()
            .build();

        connectionRef.current = connection;

        // Trade updates
        connection.on("ReceiveTradeUpdate", (trade: StockTrade) => {
            setTrades((prev) => [...prev, trade]);
        });

        // Quote updates
        connection.on("ReceiveQuoteUpdate", (quote: StockQuote) => {
            setQuotes((prev) => [...prev, quote]);
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

    const handleSubscribeTrade = () => {
        if (connectionRef.current) {
            connectionRef.current
                .invoke("SubscribeToTradeExchangeSymbol", exchange, symbol)
                .then(() => {
                    console.log(`Subscribed to ${exchange}.${symbol}`);
                    // TODO: see if we can use the MarketEvents enum here
                    setSubscriptions((prev) => [
                        ...prev,
                        { exchange, symbol, type: MarketEvents.Trade },
                    ]);
                })
                .catch((err) => console.error("Trade subscription failed: ", err));
        }
    };

    const handleSubscribeQuote = () => {
        if (connectionRef.current) {
            connectionRef.current
                .invoke("SubscribeToTradeExchangeSymbol", exchange, symbol)
                .then(() => {
                    console.log(`Subscribed to ${exchange}.${symbol}`);
                    // TODO: see if we can use the MarketEvents enum here
                    setSubscriptions((prev) => [
                        ...prev,
                        { symbol: quoteSymbol, type: MarketEvents.Quote },
                    ]);
                })
                .catch((err) => console.error("Trade subscription failed: ", err));
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
            <h1>Live Market Feed</h1>

            {/* --- Trade Subscription --- */}
            <div className="controls">
                <h2>Subscribe to Trades</h2>
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
                <button onClick={handleSubscribeTrade}>Subscribe to Trades</button>
            </div>

            {/* --- Quote Subscription --- */}
            <div className="controls" style={{ marginTop: "1rem" }}>
                <h2>Subscribe to Quotes</h2>
                <label>
                    Symbol:
                    <input
                        type="text"
                        value={quoteSymbol}
                        onChange={(e) => setQuoteSymbol(e.target.value)}
                    />
                </label>
                <button onClick={handleSubscribeQuote}>Subscribe to Quotes</button>
            </div>

            {/* --- Active Subscriptions --- */}
            <h2>Active Subscriptions</h2>
            <ul>
                {subscriptions.map((sub, idx) => (
                    <li key={idx}>
                        [{sub.type}] {sub.exchange ? `${sub.exchange}.` : ""}
                        {sub.symbol}
                    </li>
                ))}
            </ul>

            {/* --- Trade Updates --- */}
            <h2>Trade Updates</h2>
            <ul>
                {trades.map((msg, idx) => (
                    <li key={idx}>
                        {msg.exchange}.{msg.symbol} → Price: {msg.price} | Size: {msg.size}{" "}
                        | Time: {formatTimestamp(msg.timestamp)}
                    </li>
                ))}
            </ul>

            {/* --- Quote Updates --- */}
            <h2>Quote Updates</h2>
            <ul>
                {quotes.map((q, idx) => (
                    <li key={idx}>
                        {q.symbol} → Bid: {q.bidPrice} × {q.bidSize} | Ask: {q.askPrice} ×{" "}
                        {q.askSize} | Time: {formatTimestamp(q.timestamp)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
