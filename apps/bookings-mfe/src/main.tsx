// Module Federation requires shared deps (react, react-dom) to be consumed
// behind an async boundary so the federation runtime can resolve the shared
// scope first. This one-line indirection is that boundary — the real entry
// logic lives in bootstrap.tsx. (Standard pattern for every webpack/Rspack
// Module Federation app, host or remote.)
import("./bootstrap");
