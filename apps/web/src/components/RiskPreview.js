"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RiskPreview;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function RiskPreview() {
    const [entryPrice, setEntryPrice] = (0, react_1.useState)('100');
    const [equity, setEquity] = (0, react_1.useState)('1000');
    const [riskPct, setRiskPct] = (0, react_1.useState)('0.01');
    const [stopDistPct, setStopDistPct] = (0, react_1.useState)('0.005');
    const [resp, setResp] = (0, react_1.useState)(null);
    const preview = async () => {
        const body = {
            entryPrice: Number(entryPrice),
            equity: Number(equity),
            riskPct: Number(riskPct),
            stopDistPct: Number(stopDistPct)
        };
        const r = await fetch(import.meta.env.VITE_API_URL + '/api/risk/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        const data = await r.json();
        setResp(data);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-medium", children: "Risk Preview" }), (0, jsx_runtime_1.jsx)("button", { className: "btn", onClick: preview, children: "Calculate" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-3", children: [(0, jsx_runtime_1.jsx)(Input, { label: "Entry", val: entryPrice, setVal: setEntryPrice }), (0, jsx_runtime_1.jsx)(Input, { label: "Equity", val: equity, setVal: setEquity }), (0, jsx_runtime_1.jsx)(Input, { label: "Risk %", val: riskPct, setVal: setRiskPct }), (0, jsx_runtime_1.jsx)(Input, { label: "Stop Dist %", val: stopDistPct, setVal: setStopDistPct })] }), resp && ((0, jsx_runtime_1.jsxs)("div", { className: "text-sm bg-zinc-50 border rounded-xl p-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: ["positionSize: ", (0, jsx_runtime_1.jsx)("b", { children: resp.positionSize })] }), (0, jsx_runtime_1.jsxs)("div", { children: ["stopLoss: ", (0, jsx_runtime_1.jsx)("b", { children: resp.stopLoss })] }), (0, jsx_runtime_1.jsxs)("div", { children: ["takeProfit: ", (0, jsx_runtime_1.jsx)("b", { children: resp.takeProfit })] })] }))] }));
}
function Input({ label, val, setVal }) {
    return ((0, jsx_runtime_1.jsxs)("label", { className: "text-sm space-y-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-zinc-600", children: label }), (0, jsx_runtime_1.jsx)("input", { value: val, onChange: e => setVal(e.target.value), className: "w-full rounded-xl border p-2" })] }));
}
//# sourceMappingURL=RiskPreview.js.map