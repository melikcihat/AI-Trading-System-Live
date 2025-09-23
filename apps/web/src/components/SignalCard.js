"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignalCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function SignalCard() {
    const [closes, setCloses] = (0, react_1.useState)('101,102,103,104,102,101,100,99,98,97,98,99,101,103,104,105');
    const [result, setResult] = (0, react_1.useState)('—');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const submit = async () => {
        setLoading(true);
        try {
            const body = { closes: closes.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)) };
            const r = await fetch(import.meta.env.VITE_API_URL + '/api/signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });
            const data = await r.json();
            setResult(data?.signal?.side ?? 'None');
        }
        catch (e) {
            setResult('error');
        }
        finally {
            setLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "card space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-medium", children: "Signal" }), (0, jsx_runtime_1.jsx)("button", { className: "btn", onClick: submit, disabled: loading, children: loading ? 'Running…' : 'Run' })] }), (0, jsx_runtime_1.jsx)("textarea", { value: closes, onChange: e => setCloses(e.target.value), rows: 4, className: "w-full rounded-xl border p-3", placeholder: "comma-separated closes" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-zinc-600", children: ["Result: ", (0, jsx_runtime_1.jsx)("b", { children: result })] })] }));
}
//# sourceMappingURL=SignalCard.js.map