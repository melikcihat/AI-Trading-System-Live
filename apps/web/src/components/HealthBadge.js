"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HealthBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function HealthBadge() {
    const [ok, setOk] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetch(import.meta.env.VITE_API_URL + '/api/health')
            .then(r => r.json())
            .then(d => setOk(!!d.status))
            .catch(() => setOk(false));
    }, []);
    const cls = ok === null
        ? 'badge border-zinc-300'
        : ok ? 'badge border-green-300 text-green-700 bg-green-50'
            : 'badge border-red-300 text-red-700 bg-red-50';
    return (0, jsx_runtime_1.jsx)("span", { className: cls, children: ok === null ? 'checking…' : ok ? 'healthy' : 'down' });
}
//# sourceMappingURL=HealthBadge.js.map