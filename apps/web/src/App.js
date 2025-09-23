"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const HealthBadge_1 = __importDefault(require("./components/HealthBadge"));
const SignalCard_1 = __importDefault(require("./components/SignalCard"));
const RiskPreview_1 = __importDefault(require("./components/RiskPreview"));
function App() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-zinc-50 text-zinc-900", children: [(0, jsx_runtime_1.jsx)("header", { className: "sticky top-0 z-10 border-b bg-white/80 backdrop-blur", children: (0, jsx_runtime_1.jsxs)("div", { className: "container-page flex items-center justify-between py-3", children: [(0, jsx_runtime_1.jsx)("h1", { className: "font-semibold", children: "HubAI-lite" }), (0, jsx_runtime_1.jsx)(HealthBadge_1.default, {})] }) }), (0, jsx_runtime_1.jsxs)("main", { className: "container-page grid gap-6 md:grid-cols-2", children: [(0, jsx_runtime_1.jsx)(SignalCard_1.default, {}), (0, jsx_runtime_1.jsx)(RiskPreview_1.default, {})] })] }));
}
//# sourceMappingURL=App.js.map