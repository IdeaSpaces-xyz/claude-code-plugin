#!/usr/bin/env node
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep2 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + match[1];
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep2 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          Array.prototype.push.apply(doc.errors, this.errors);
          Array.prototype.push.apply(doc.warnings, this.warnings);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep2, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return yield* this.parseBlockStart();
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        switch (this.charAt(0)) {
          case "!":
            return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          case "&":
            return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          case "-":
          // this is an error
          case "?":
          // this is an error outside flow collections
          case ":": {
            const inFlow = this.flowLevel > 0;
            const ch1 = this.charAt(1);
            if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
              if (!inFlow)
                this.indentNext = this.indentValue + 1;
              else if (this.flowKey)
                this.flowKey = false;
              return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
            }
          }
        }
        return 0;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list2, type) {
      for (let i = 0; i < list2.length; ++i)
        if (list2[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list2) {
      for (let i = 0; i < list2.length; ++i) {
        switch (list2[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                Array.prototype.push.apply(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              Array.prototype.push.apply(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar.end) {
            sep2 = scalar.end;
            sep2.push(this.sourceToken);
            delete scalar.end;
          } else
            sep2 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  Array.prototype.push.apply(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep2 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs7 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs7, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs7);
              } else {
                Object.assign(it, { key: fs7, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  Array.prototype.push.apply(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs7 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs7, sep: [] });
              else if (it.sep)
                this.stack.push(fs7);
              else
                Object.assign(it, { key: fs7, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument4(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument4(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument4;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// dist/main.js
import { writeSync } from "node:fs";

// dist/commands/create.js
import { promises as fs } from "node:fs";
import { existsSync as existsSync3, realpathSync } from "node:fs";
import { spawnSync as spawnSync2 } from "node:child_process";
import { join as join3, resolve as resolve2, relative, basename } from "node:path";

// dist/output.js
function createOutput(flags2) {
  return {
    result(data, humanText) {
      if (flags2.json) {
        process.stdout.write(JSON.stringify(data, null, 2) + "\n");
      } else {
        process.stdout.write(humanText + "\n");
      }
    },
    log(text) {
      if (!flags2.quiet) {
        process.stderr.write(text + "\n");
      }
    },
    progress(text) {
      if (!flags2.quiet && !flags2.json) {
        process.stderr.write(text + "\n");
      }
    },
    error(text) {
      process.stderr.write(text + "\n");
    }
  };
}

// dist/auth/credentials.js
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join as join2 } from "node:path";

// dist/auth/config-dir.js
import { homedir } from "node:os";
import { join } from "node:path";
function configDir() {
  return join(homedir(), ".ideaspaces");
}

// dist/auth/credentials.js
function credentialsFile() {
  return join2(configDir(), "credentials.json");
}
function loadStoredCredentials() {
  const file = credentialsFile();
  try {
    if (!existsSync(file))
      return null;
    const raw = readFileSync(file, "utf-8");
    const data = JSON.parse(raw);
    if (!data.api_key)
      return null;
    return data;
  } catch {
    return null;
  }
}
function saveCredentials(creds) {
  const dir = configDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 448 });
  }
  writeFileSync(credentialsFile(), JSON.stringify(creds, null, 2) + "\n", {
    mode: 384
  });
}
function deleteCredentials() {
  const file = credentialsFile();
  try {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  } catch {
  }
}
var DEFAULT_API_URL = "https://api.ideaspaces.xyz";
function loadConfig() {
  const envKey = process.env.IS_API_KEY;
  if (envKey) {
    return {
      apiUrl: (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: envKey
    };
  }
  const stored = loadStoredCredentials();
  if (stored) {
    return {
      apiUrl: (process.env.IS_API_URL || stored.api_url || DEFAULT_API_URL).replace(/\/$/, ""),
      apiKey: stored.api_key
    };
  }
  return null;
}
function getDefaultApiUrl() {
  return (process.env.IS_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
}

// dist/auth/api.js
var API_V1 = "/api/v1";
var DEFAULT_REQUEST_TIMEOUT_MS = 5e3;
function deriveGitBase(apiUrl) {
  const override = process.env.IS_GIT_URL;
  if (override)
    return override.replace(/\/+$/, "");
  try {
    const url = new URL(apiUrl);
    if (url.hostname.startsWith("api.")) {
      url.hostname = "git." + url.hostname.slice(4);
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return apiUrl.replace(/\/+$/, "");
  }
}
function deriveWebBase(apiUrl) {
  const override = process.env.IS_WEB_URL;
  if (override)
    return override.replace(/\/+$/, "");
  try {
    const url = new URL(apiUrl);
    if (url.hostname.startsWith("api.")) {
      url.hostname = url.hostname.slice(4);
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return apiUrl.replace(/\/+$/, "");
  }
}
var UnauthorizedError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
  }
};
var NetworkError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
};
function isConnectionFailure(err) {
  return err instanceof TypeError && /fetch failed/i.test(err.message);
}
function unreachableMessage(apiUrl, timedOut) {
  let host = apiUrl;
  try {
    host = new URL(apiUrl).host;
  } catch {
  }
  const lead = timedOut ? `Reaching ${host} timed out \u2014 the server may be slow, or the network unreachable.` : `Can't reach ${host} \u2014 the network looks unreachable.`;
  return `${lead} If you're in Cowork, its sandbox blocks remote access \u2014 switch to Claude Code view to browse and sync (local capture still works).`;
}
function authHeaders(config, extra) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    ...extra
  };
}
async function request(config, method, path, body, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const maxAttempts = method === "GET" && opts.retry !== false ? 2 : 1;
  for (let attempt = 1; ; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(`${config.apiUrl}${path}`, {
        method,
        headers: authHeaders(config),
        body: body !== void 0 ? JSON.stringify(body) : void 0,
        signal: ctrl.signal
      });
      if (!r.ok) {
        const text = await r.text();
        if (r.status === 401) {
          throw new UnauthorizedError(`${method} ${path} \u2192 401: ${text || r.statusText}`);
        }
        throw new Error(`${method} ${path} \u2192 ${r.status}: ${text || r.statusText}`);
      }
      if (r.status === 204)
        return void 0;
      const payload = await r.text();
      return payload ? JSON.parse(payload) : void 0;
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "AbortError";
      if (timedOut && attempt < maxAttempts)
        continue;
      if (timedOut) {
        throw new NetworkError(unreachableMessage(config.apiUrl, true));
      }
      if (isConnectionFailure(err)) {
        throw new NetworkError(unreachableMessage(config.apiUrl, false));
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
async function fetchAuthMe(config, opts) {
  return request(config, "GET", "/auth/me", void 0, opts);
}
async function createRepo(config, body, opts) {
  return request(config, "POST", `${API_V1}/repos`, body, opts);
}
async function fetchConversations(config, repoId, opts) {
  return request(config, "GET", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations?limit=50&offset=0`, void 0, opts);
}
async function createConversation(config, repoId, body = {}, opts) {
  return request(config, "POST", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations`, body, opts);
}
async function fetchAgents(config, owner, opts) {
  const qs = owner ? `?owner=${encodeURIComponent(owner)}` : "";
  const res = await request(config, "GET", `${API_V1}/agents${qs}`, void 0, opts);
  return res.agents;
}
async function fetchNode(config, repoId, nodeId, opts) {
  return request(config, "GET", `${API_V1}/repos/${encodeURIComponent(repoId)}/nodes/${encodeURIComponent(nodeId)}`, void 0, opts);
}
function filesPath(repoId, path) {
  const segs = path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${API_V1}/repos/${encodeURIComponent(repoId)}/files/${segs}`;
}
async function putFile(config, repoId, path, content, opts) {
  return request(config, "PUT", filesPath(repoId, path), { content }, opts);
}
var repoBase = (repoId) => `${API_V1}/repos/${encodeURIComponent(repoId)}`;
async function listRepoMembers(config, repoId) {
  return request(config, "GET", `${repoBase(repoId)}/members`);
}
async function removeRepoMember(config, repoId, userId) {
  await request(config, "DELETE", `${repoBase(repoId)}/members/${encodeURIComponent(String(userId))}`);
}
async function listRepoInvites(config, repoId) {
  return request(config, "GET", `${repoBase(repoId)}/invites`);
}
async function createRepoInvites(config, repoId, emails, role) {
  return request(config, "POST", `${repoBase(repoId)}/invites`, {
    emails,
    role
  });
}
async function revokeRepoInvite(config, repoId, inviteId) {
  await request(config, "DELETE", `${repoBase(repoId)}/invites/${encodeURIComponent(inviteId)}`);
}
async function getSpaceAccess(config, repoId) {
  return request(config, "GET", `${repoBase(repoId)}/space-access`);
}
async function setSpaceAccess(config, repoId, update) {
  return request(config, "PATCH", `${repoBase(repoId)}/space-access`, update);
}
async function listParticipants(config, repoId, conversationId, opts) {
  return request(config, "GET", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations/${encodeURIComponent(conversationId)}/participants`, void 0, opts);
}
async function addParticipant(config, repoId, conversationId, participant, role = "member", opts) {
  return request(config, "POST", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations/${encodeURIComponent(conversationId)}/participants`, { participant, role }, opts);
}
async function removeParticipant(config, repoId, conversationId, participant, opts) {
  return request(config, "DELETE", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations/${encodeURIComponent(conversationId)}/participants/${encodeURIComponent(participant)}`, void 0, opts);
}
async function fetchRepoMembers(config, repoId, opts) {
  return request(config, "GET", `${API_V1}/repos/${encodeURIComponent(repoId)}/members`, void 0, opts);
}
async function getConversation(config, repoId, conversationId, opts) {
  return request(config, "GET", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations/${encodeURIComponent(conversationId)}`, void 0, opts);
}
async function cancelConversationTurn(config, repoId, conversationId, opts) {
  return request(config, "DELETE", `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations/${encodeURIComponent(conversationId)}/current`, void 0, opts);
}
function parseSseBlock(block) {
  const data = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).replace(/^ /, "")).join("\n");
  if (!data || data === "[DONE]")
    return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
async function* streamConversationMessage(config, repoId, conversationId, body, signal) {
  const path = `${API_V1}/repos/${encodeURIComponent(repoId)}/conversations/${encodeURIComponent(conversationId)}/messages/stream`;
  const r = await fetch(`${config.apiUrl}${path}`, {
    method: "POST",
    headers: authHeaders(config, { Accept: "text/event-stream" }),
    body: JSON.stringify(body),
    signal
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    if (r.status === 401) {
      throw new UnauthorizedError(`POST ${path} \u2192 401: ${text || r.statusText}`);
    }
    throw new Error(`POST ${path} \u2192 ${r.status}: ${text || r.statusText}`);
  }
  if (!r.body)
    throw new Error("stream: server returned no response body");
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        const event = parseSseBlock(block);
        if (event)
          yield event;
      }
    }
    const tail = (buffer + decoder.decode()).replace(/\r\n/g, "\n").trim();
    if (tail) {
      const event = parseSseBlock(tail);
      if (event)
        yield event;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
    }
  }
}

// dist/git.js
import { spawnSync } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { resolve } from "node:path";
var GitError = class extends Error {
};
var GIT_MISSING_HINT = "git not found \u2014 install it and retry (macOS: `brew install git`; Windows: `winget install Git.Git`; Linux: your package manager).";
function gitAvailable() {
  return spawnSync("git", ["--version"]).error === void 0;
}
function git(args2, cwd) {
  const r = spawnSync("git", args2, { encoding: "utf-8", cwd });
  if (r.error) {
    const code = r.error.code;
    return { ok: false, out: "", err: code === "ENOENT" ? GIT_MISSING_HINT : `git could not run: ${r.error.message}` };
  }
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}
function gitExit(args2, cwd) {
  const r = spawnSync("git", args2, { encoding: "utf-8", cwd });
  return r.status ?? -1;
}
function gitOrThrow(args2, cwd) {
  const r = git(args2, cwd);
  if (!r.ok)
    throw new GitError(r.err || r.out || `git ${args2.join(" ")} failed`);
  return r.out;
}
function cloneRepo(url, dir) {
  gitOrThrow(["clone", url, dir]);
}
function isInsideWorkTree(cwd) {
  const r = git(["rev-parse", "--is-inside-work-tree"], cwd);
  return r.ok && r.out === "true";
}
function originUrl(cwd) {
  const r = git(["remote", "get-url", "origin"], cwd);
  return r.ok ? r.out || null : null;
}
function normalizeRepoUrl(raw) {
  let s = raw.trim();
  if (!s)
    return null;
  const scp = /^[^/@]+@([^:/]+):(.+)$/.exec(s);
  if (scp)
    s = `ssh://${scp[1]}/${scp[2]}`;
  let host;
  let path;
  try {
    const u = new URL(s);
    host = u.hostname;
    path = u.pathname;
  } catch {
    return null;
  }
  path = path.replace(/^\/+/, "").replace(/\.git$/i, "").replace(/\/+$/, "");
  if (!host || !path)
    return null;
  return `${host.toLowerCase()}/${path}`;
}
function localConfig(key, cwd) {
  const r = git(["config", "--local", key], cwd);
  return r.ok ? r.out || null : null;
}
function setLocalConfig(key, value, cwd) {
  gitOrThrow(["config", "--local", key, value], cwd);
}
function repoRoot(cwd) {
  const r = git(["rev-parse", "--show-toplevel"], cwd);
  if (!r.ok)
    throw new GitError("not inside a git repository");
  return r.out;
}
function headSha(cwd) {
  return gitOrThrow(["rev-parse", "HEAD"], cwd);
}
function stagePaths(paths, cwd) {
  if (!paths.length)
    return;
  gitOrThrow(["add", "--", ...paths], cwd);
}
function commitPaths(message, paths, cwd) {
  if (!paths.length)
    throw new GitError("refusing to commit with no paths");
  const base = cwd ?? process.cwd();
  const present = paths.filter((p) => existsSync2(resolve(base, p)));
  if (present.length)
    gitOrThrow(["add", "--", ...present], cwd);
  gitOrThrow(["commit", "-q", "-m", message, "--", ...paths], cwd);
  return headSha(cwd);
}
function blobSha(path, cwd) {
  const r = git(["hash-object", "--", path], cwd);
  return r.ok ? r.out : null;
}
function pathStatus(path, cwd) {
  const sha = blobSha(path, cwd);
  return {
    path,
    exists: sha !== null,
    sha,
    inIndex: gitExit(["diff", "--cached", "--quiet", "--", path], cwd) === 1,
    modified: gitExit(["diff", "--quiet", "--", path], cwd) === 1,
    inTracked: git(["ls-files", "--error-unmatch", "--", path], cwd).ok
  };
}
function statusEntries(cwd) {
  const out = gitOrThrow(["status", "--porcelain"], cwd);
  if (!out)
    return [];
  return out.split("\n").map((line) => ({
    status: line.slice(0, 2),
    path: line.slice(3)
  }));
}
function isDirty(cwd) {
  return statusEntries(cwd).some((e) => !e.status.startsWith("??"));
}
function stagedPaths(cwd) {
  const r = git(["diff", "--cached", "--name-only"], cwd);
  if (!r.ok || !r.out)
    return [];
  return r.out.split("\n").filter(Boolean);
}
function isIdeaspacePath(path) {
  return path.endsWith(".md") || path.split("/").includes("_agent");
}
function listFiles(cwd) {
  const r = git(["ls-files", "--cached", "--others", "--exclude-standard"], cwd);
  if (!r.ok || !r.out)
    return [];
  return r.out.split("\n").filter(Boolean);
}
function stagedIdeaspacePaths(cwd) {
  return stagedPaths(cwd).filter(isIdeaspacePath);
}
function fileTimes(cwd) {
  const r = git(["log", "--format=%ct", "--name-only", "--no-renames"], cwd);
  if (!r.ok || !r.out)
    return [];
  const created = /* @__PURE__ */ new Map();
  const updated = /* @__PURE__ */ new Map();
  let ms = 0;
  for (const line of r.out.split("\n")) {
    if (/^\d+$/.test(line)) {
      ms = Number(line) * 1e3;
      continue;
    }
    const path = line.trim();
    if (!path || !(path.endsWith(".md") || path.endsWith(".markdown")))
      continue;
    if (!updated.has(path))
      updated.set(path, ms);
    created.set(path, ms);
  }
  return [...updated.keys()].map((path) => ({
    path,
    created_at: created.get(path) ?? updated.get(path),
    updated_at: updated.get(path)
  }));
}
function fetch2(cwd) {
  gitOrThrow(["fetch"], cwd);
}
function remoteState(cwd) {
  const up = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], cwd);
  if (!up.ok || !up.out)
    return { upstream: null, ahead: 0, behind: 0 };
  const counts = git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], cwd);
  if (!counts.ok)
    return { upstream: up.out, ahead: 0, behind: 0 };
  const [behind, ahead] = counts.out.split(/\s+/).map((n) => parseInt(n, 10) || 0);
  return { upstream: up.out, ahead, behind };
}
function rebaseOntoUpstream(cwd) {
  gitOrThrow(["rebase", "@{upstream}"], cwd);
}
function mergeUpstream(cwd) {
  gitOrThrow(["merge", "--no-edit", "@{upstream}"], cwd);
}
function push(cwd) {
  gitOrThrow(["push"], cwd);
}

// dist/auth/identity.js
function identityEmail(username) {
  return `person:${username}@ideaspaces`;
}
var isIdentityEmail = (email) => /^person:.+@ideaspaces$/.test(email);
function identityName(me) {
  return me.name ?? me.username;
}
async function ensureLocalIdentity(repoDir) {
  try {
    const current = localConfig("user.email", repoDir);
    if (current && isIdentityEmail(current))
      return;
    const stored = loadStoredCredentials();
    if (!stored)
      return;
    const me = await fetchAuthMe({ apiUrl: stored.api_url, apiKey: stored.api_key }, { timeoutMs: 2e3, retry: false });
    if (!me.username)
      return;
    setLocalConfig("user.email", identityEmail(me.username), repoDir);
    setLocalConfig("user.name", identityName({ name: me.name, username: me.username }), repoDir);
  } catch {
  }
}

// dist/templates/default.js
var FOUNDATION_MD = `---
name: Foundation
summary: Baseline contract for this ideaspace \u2014 what kind of place this is, how
  the agent and human work together. Lives only at the space root and always
  loads; deeper branches refine via their own \`_agent/\` when they need to.
---

# Foundation

> Baseline for the space. Lives only at the root.

---

## Space

This is an ideaspace \u2014 a markdown folder where knowledge accumulates. The
directory tree is how you navigate. \`_agent/\` carries the Agreement between
you and the user about how to work here.

The five-file contract:

- \`foundation.md\` \u2014 this file. What this place is, baseline behaviors.
- \`guide.md\` \u2014 specific agreements for this space.
- \`purpose.md\` \u2014 why this place exists.
- \`now.md\` \u2014 what's currently active.
- \`next.md\` \u2014 what's queued.

Only \`foundation.md\` and \`guide.md\` are scaffolded at create time.
\`purpose.md\`, \`now.md\`, and \`next.md\` are emergent \u2014 when the agent
reads this contract and finds those files missing, propose creating
them in conversation. Real content from real exchange.

Optional dimensions inside \`_agent/\` (add as the space earns them):

- \`skills/\` \u2014 operating procedures the agent should follow here. Each
  skill is a markdown file (e.g., \`commit.md\` for the commit shape).
  Surfaced at session start by name + summary; body loads on demand.

\`CLAUDE.md\` at the space root tells Claude Code where this contract lives.

\`.gitignore\` is also part of the Agreement \u2014 the boundary between what's
shared and what stays local. Drafts, scratch, secrets, per-developer context
go there. Propose changes; never edit silently.

---

## Identity

You inhabit the Space. Position persists across turns. The Space outlasts
the conversation \u2014 when it matters, verify against the Space rather than
relying on conversation memory.

**Drawing out over filling in.** Your questions surface what's already there.

**Evidence over assertion.** Work with what's provided. Gaps are information.

**Form over meaning.** The user provides meaning. You provide structure.
Structure reveals contradictions.

**Honesty over comfort.** Surface contradictions. Notice when stated criteria
don't match actual decisions.

---

## Practice

- **No slop.** Every line earns its place.
- **Capture is conscious.** Propose; the user confirms. Both sides agree before
  committing.
- **Three-tier commits.** Subject (one line), body (what shifted, why),
  trailers (\`Co-authored-by\`, etc.).

When the Agreement drifts \u2014 \`now.md\` no longer matches reality, or guidance
contradicts current practice \u2014 surface it. Update [guide.md](guide.md) for
this scope, or revisit this file if a baseline needs to shift.
`;
var GUIDE_MD = `---
name: Guide
summary: Specific agreements for working in this space. As patterns emerge \u2014
  how we capture, what conventions live where, how branches are organized \u2014
  capture them here.
---

# Guide

> Specific agreements for this space, beyond [foundation](foundation.md)
> defaults.

---

## What's specific here

_Fill in as patterns emerge. Examples to consider:_

- Is the \`_agent/\` shared (committed) or private (gitignored)?
- Where do conventions live (commit shape, tagging, identity)?
- Are there active tracks running in parallel?

---

## When the Agreement drifts

If \`now.md\` stops matching reality, or [foundation](foundation.md)
contradicts current practice, or this guide is silent on something we keep
doing \u2014 surface it. Update this guide for this scope, or revisit foundation
if a baseline needs to shift.
`;
var GITATTRIBUTES = `*.md diff=markdown text eol=lf
`;
var CLAUDE_MD = `---
name: Claude Code orientation
summary: Tells Claude Code this directory is an ideaspace and points at the seed
  _agent contract. Purpose, Now, and Next may be missing at first; their absence
  is a prompt to capture real direction in conversation.
---

# CLAUDE.md

> This is an ideaspace. The \`_agent/\` contract carries the working agreement.

## Orient

At session start, read the seed files first:

1. [\`_agent/foundation.md\`](_agent/foundation.md) \u2014 what this place is, baseline behaviors
2. [\`_agent/guide.md\`](_agent/guide.md) \u2014 how agent and human work together here

Then look for the emergent direction files:

3. \`_agent/purpose.md\` \u2014 why this exists
4. \`_agent/now.md\` \u2014 what's currently active
5. \`_agent/next.md\` \u2014 what's queued

\`purpose.md\`, \`now.md\`, and \`next.md\` may not exist yet. If missing,
don't invent them. Treat the gap as direction not yet captured and propose
creating them in conversation when there is enough real signal.

## When the Agreement drifts

Now stops matching reality. Foundation contradicts current practice. Guide is
silent on something we keep doing. \u2192 Surface it. Propose an update. Update
[\`_agent/guide.md\`](_agent/guide.md) for this scope, or revisit
[\`_agent/foundation.md\`](_agent/foundation.md) if a baseline needs to shift.
`;
function gitignoreDefaults(opts) {
  const lines = ["", "# ideaspace defaults"];
  if (opts.privateAgent) {
    lines.push("# (code repo with private _agent/ \u2014 each developer's contract stays local)", "_agent/", "CLAUDE.local.md");
  }
  lines.push("*.draft.md", "scratch/", "_local/", "");
  return lines.join("\n");
}
var CONTRACT_TEMPLATES = {
  foundation: FOUNDATION_MD,
  guide: GUIDE_MD
};

// dist/commands/create.js
var CODE_SIGNALS = [
  ".github",
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "Gemfile",
  "pom.xml"
];
var OLD_AGENT_FILES = ["always.md", "rules.md", "soul.md", "guidance.md"];
var createCommand = {
  name: "create",
  description: "Scaffold an ideaspace (seed _agent/ contract + CLAUDE.md + .gitignore defaults)",
  usage: "ideaspaces create [name] [--yes] [--shared]",
  examples: [
    "ideaspaces create my-space             # plan in ./my-space/, exit without applying",
    "ideaspaces create my-space --yes       # scaffold and commit",
    "ideaspaces create --yes                # scaffold in current directory",
    "ideaspaces create --yes --shared       # in a code repo, opt into shared (committed) _agent/"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const name = args2[0];
    const targetDir = name ? resolve2(process.cwd(), name) : process.cwd();
    const apply = global2.yes === true;
    const sharedFlag = Boolean(flags2.shared);
    const inspection = await inspect(targetDir);
    const shape = detectShape(inspection);
    if (shape === "complete") {
      output.error(`${describeTarget(targetDir, name)} is already an ideaspace. Edit \`_agent/\` directly, or ask your agent to reflect on direction.`);
      return 5;
    }
    if (shape === "old-shape") {
      output.error(`${describeTarget(targetDir, name)} has an \`_agent/\` in the legacy shape (always.md / rules.md / soul.md). Migration is not yet automated; move their content into the current \`_agent/\` contract (foundation.md / guide.md / purpose.md / now.md / next.md) by hand.`);
      return 5;
    }
    const privateAgent = shape === "code-repo" && !sharedFlag;
    const plan = buildPlan({ targetDir, name, shape, inspection, privateAgent });
    if (!apply) {
      output.result({ target: targetDir, shape, privateAgent, nestedInRepo: inspection.nestedInRepo, plan: plan.steps }, renderPlanText({ targetDir, name, shape, privateAgent, plan, nestedInRepo: inspection.nestedInRepo }));
      return 0;
    }
    let versioned;
    let gitNote;
    try {
      ({ versioned, gitNote } = await applyPlan({ targetDir, inspection, privateAgent }));
    } catch (err) {
      output.error(`Scaffold failed: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    const where = name ? `./${name}` : "this directory";
    const lines = [
      `Scaffolded ${describeTarget(targetDir, name)} (${shape}${privateAgent ? ", private _agent/" : ""}).`
    ];
    if (inspection.nestedInRepo) {
      lines.push(nestingNotice(targetDir, inspection.nestedInRepo));
    }
    if (!versioned) {
      lines.push(`Working locally \u2014 no version history yet. ${gitNote ?? ""}`.trim(), `Once git is ready, from ${where}: \`git init -b main && git add . && git commit -m "Initial ideaspace scaffold"\`.`);
    }
    lines.push(`Next: open Claude Code in ${where} \u2014 the agent will read foundation+guide and propose capturing purpose / now / next in conversation.`);
    if (versioned && loadStoredCredentials()) {
      lines.push(`When ready to host this remotely, run \`ideaspaces publish\` from inside ${where}.`);
    }
    output.result({ target: targetDir, shape, privateAgent, scaffolded: true, versioned }, lines.join("\n"));
    return 0;
  }
};
async function inspect(targetDir) {
  const nestedInRepo = enclosingRepoRoot(targetDir);
  if (!existsSync3(targetDir)) {
    return {
      exists: false,
      isGitRepo: false,
      nestedInRepo,
      hasNewAgent: false,
      hasOldAgent: false,
      hasClaude: false,
      hasGitignore: false,
      hasCodeSignal: false,
      markdownCount: 0
    };
  }
  const isGitRepo = existsSync3(join3(targetDir, ".git"));
  const hasClaude = existsSync3(join3(targetDir, "CLAUDE.md"));
  const hasGitignore = existsSync3(join3(targetDir, ".gitignore"));
  const agentDir = join3(targetDir, "_agent");
  const hasNewAgent = existsSync3(join3(agentDir, "foundation.md"));
  const hasOldAgent = existsSync3(agentDir) && OLD_AGENT_FILES.some((f) => existsSync3(join3(agentDir, f))) && !hasNewAgent;
  let hasCodeSignal = false;
  for (const sig of CODE_SIGNALS) {
    if (existsSync3(join3(targetDir, sig))) {
      hasCodeSignal = true;
      break;
    }
  }
  let markdownCount = 0;
  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".md"))
        markdownCount += 1;
    }
  } catch {
  }
  return {
    exists: true,
    isGitRepo,
    nestedInRepo,
    hasNewAgent,
    hasOldAgent,
    hasClaude,
    hasGitignore,
    hasCodeSignal,
    markdownCount
  };
}
function detectShape(inspection) {
  if (!inspection.exists)
    return "greenfield";
  if (inspection.hasNewAgent && inspection.hasClaude)
    return "complete";
  if (inspection.hasOldAgent)
    return "old-shape";
  if (inspection.hasCodeSignal)
    return "code-repo";
  if (inspection.markdownCount > 0)
    return "content-existing";
  return "greenfield";
}
function buildPlan(opts) {
  const { targetDir, name, inspection, privateAgent } = opts;
  const steps = [];
  if (name && !inspection.exists) {
    steps.push({ op: "mkdir", path: targetDir });
  }
  if (!inspection.isGitRepo) {
    steps.push({ op: "git-init", path: targetDir });
  }
  for (const fileName of Object.keys(CONTRACT_TEMPLATES)) {
    steps.push({ op: "write", path: join3(targetDir, "_agent", `${fileName}.md`) });
  }
  const claudeFile = privateAgent ? "CLAUDE.local.md" : "CLAUDE.md";
  if (!inspection.hasClaude) {
    steps.push({ op: "write", path: join3(targetDir, claudeFile) });
  }
  if (!existsSync3(join3(targetDir, ".gitattributes"))) {
    steps.push({
      op: "write",
      path: join3(targetDir, ".gitattributes"),
      detail: "markdown diff/eol attributes"
    });
  }
  steps.push({
    op: inspection.hasGitignore ? "append" : "write",
    path: join3(targetDir, ".gitignore"),
    detail: privateAgent ? "private _agent/ defaults" : "content-space defaults"
  });
  steps.push({ op: "commit", detail: "Initial ideaspace scaffold" });
  return { steps };
}
function renderPlanText(opts) {
  const { targetDir, name, shape, privateAgent, plan, nestedInRepo } = opts;
  const lines = [];
  lines.push(`Plan for ${describeTarget(targetDir, name)} \u2014 shape: ${shape}${privateAgent ? " (private _agent/)" : ""}`);
  if (nestedInRepo) {
    lines.push("");
    lines.push(nestingNotice(targetDir, nestedInRepo));
  }
  lines.push("");
  for (const step of plan.steps) {
    const tag = step.op.toUpperCase().padEnd(9);
    const detail = step.detail ? ` \u2014 ${step.detail}` : "";
    const path = step.path ? ` ${step.path}` : "";
    lines.push(`  ${tag}${path}${detail}`);
  }
  lines.push("");
  lines.push("Re-run with --yes to apply.");
  return lines.join("\n");
}
async function applyPlan(opts) {
  const { targetDir, inspection, privateAgent } = opts;
  await fs.mkdir(targetDir, { recursive: true });
  await fs.mkdir(join3(targetDir, "_agent"), { recursive: true });
  for (const [name, content] of Object.entries(CONTRACT_TEMPLATES)) {
    await fs.writeFile(join3(targetDir, "_agent", `${name}.md`), content, "utf-8");
  }
  const claudeFile = privateAgent ? "CLAUDE.local.md" : "CLAUDE.md";
  if (!inspection.hasClaude) {
    await fs.writeFile(join3(targetDir, claudeFile), CLAUDE_MD, "utf-8");
  }
  const gitattributesPath = join3(targetDir, ".gitattributes");
  if (!existsSync3(gitattributesPath)) {
    await fs.writeFile(gitattributesPath, GITATTRIBUTES, "utf-8");
  }
  const gitignorePath = join3(targetDir, ".gitignore");
  const additions = gitignoreDefaults({ privateAgent });
  if (inspection.hasGitignore) {
    const existing = await fs.readFile(gitignorePath, "utf-8");
    if (!existing.includes("# ideaspace defaults")) {
      await fs.writeFile(gitignorePath, existing.endsWith("\n") ? existing + additions : existing + "\n" + additions, "utf-8");
    }
  } else {
    await fs.writeFile(gitignorePath, additions.replace(/^\n/, ""), "utf-8");
  }
  if (!gitAvailable())
    return { versioned: false, gitNote: GIT_MISSING_HINT };
  try {
    if (!inspection.isGitRepo) {
      runGit(targetDir, ["init", "-q", "-b", "main"]);
    }
    await maybeSetIdentity(targetDir);
    runGit(targetDir, ["add", "."]);
    runGit(targetDir, ["commit", "-q", "-m", "Initial ideaspace scaffold"]);
    return { versioned: true };
  } catch (err) {
    return { versioned: false, gitNote: err instanceof Error ? err.message : String(err) };
  }
}
async function maybeSetIdentity(targetDir) {
  const stored = loadStoredCredentials();
  if (!stored)
    return;
  try {
    const me = await fetchAuthMe({ apiUrl: stored.api_url, apiKey: stored.api_key }, { timeoutMs: 2e3, retry: false });
    if (!me.username)
      return;
    runGit(targetDir, ["config", "--local", "user.email", identityEmail(me.username)]);
  } catch {
  }
}
function runGit(cwd, args2) {
  const r = spawnSync2("git", ["-C", cwd, ...args2], { encoding: "utf-8" });
  if (r.error) {
    throw new Error(`git ${args2.join(" ")}: ${r.error.message}`);
  }
  if (r.status !== 0) {
    const message = (r.stderr ?? "").trim() || (r.stdout ?? "").trim() || `exit ${r.status}`;
    throw new Error(`git ${args2.join(" ")}: ${message}`);
  }
}
function effectiveRealPath(target) {
  let probe = target;
  const suffix = [];
  while (!existsSync3(probe)) {
    const parent = resolve2(probe, "..");
    if (parent === probe)
      return target;
    suffix.unshift(basename(probe));
    probe = parent;
  }
  const real = realpathSync(probe);
  return suffix.length ? join3(real, ...suffix) : real;
}
function enclosingRepoRoot(targetDir) {
  let probe = targetDir;
  while (!existsSync3(probe)) {
    const parent = resolve2(probe, "..");
    if (parent === probe)
      return null;
    probe = parent;
  }
  const r = spawnSync2("git", ["-C", probe, "rev-parse", "--show-toplevel"], { encoding: "utf-8" });
  if (r.status !== 0)
    return null;
  const root = r.stdout.trim();
  if (!root)
    return null;
  return root !== effectiveRealPath(targetDir) ? root : null;
}
function nestingNotice(targetDir, parentRoot) {
  const rel = relative(parentRoot, effectiveRealPath(targetDir)) || basename(targetDir);
  return `Note: this folder is inside git repo ${parentRoot}.
  Creating an independent ideaspace repo here \u2014 ${parentRoot} will see \`${rel}/\` as an untracked nested repo.
  Add \`${rel}/\` to ${join3(parentRoot, ".gitignore")} to keep them separate.`;
}
function describeTarget(targetDir, name) {
  return name ? `./${basename(targetDir)}` : "the current directory";
}

// dist/commands/login.js
import { exec } from "node:child_process";
import { platform } from "node:os";

// dist/auth/callback-server.js
import { createServer } from "node:http";
import { URL as URL2 } from "node:url";
var SUCCESS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>IdeaSpaces \u2014 Logged In</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
<div style="text-align: center;">
<h2>Logged in to IdeaSpaces</h2>
<p style="color: #888;">You can close this tab and return to your terminal.</p>
</div>
</body></html>`;
var ERROR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>IdeaSpaces \u2014 Error</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa;">
<div style="text-align: center;">
<h2>Login failed</h2>
<p style="color: #888;">No token received. Please try again.</p>
</div>
</body></html>`;
function startCallbackServer() {
  return new Promise((resolve15, reject) => {
    let tokenResolve = null;
    let tokenReject = null;
    const server = createServer((req, res) => {
      const url = new URL2(req.url || "/", `http://127.0.0.1`);
      if (url.pathname === "/callback") {
        const token = url.searchParams.get("token");
        if (token) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(SUCCESS_HTML);
          tokenResolve?.(token);
        } else {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(ERROR_HTML);
          tokenReject?.(new Error("No token in callback"));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }
      resolve15({
        port: addr.port,
        waitForCallback(timeoutMs = 12e4) {
          return new Promise((res, rej) => {
            tokenResolve = res;
            tokenReject = rej;
            const timer = setTimeout(() => {
              rej(new Error("Login timed out \u2014 no callback received within 2 minutes"));
              server.close();
            }, timeoutMs);
            const origResolve = tokenResolve;
            tokenResolve = (token) => {
              clearTimeout(timer);
              origResolve(token);
            };
          });
        },
        close() {
          server.close();
        }
      });
    });
    server.on("error", reject);
  });
}

// dist/auth/git-credential-helper.js
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var execFileAsync = promisify(execFile);
var GIT_HOSTS = [
  "https://git.ideaspaces.xyz",
  "https://git.ideaspaces.localhost"
];
function shellQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
function selfCredentialHelper() {
  const exe = process.execPath;
  const entry = process.argv[1];
  const compiled = !entry || entry.includes("$bunfs");
  const cmd2 = compiled ? shellQuote(exe) : `${shellQuote(exe)} ${shellQuote(entry)}`;
  return `!${cmd2} credential`;
}
async function registerGitCredentialHelper() {
  const helper = selfCredentialHelper();
  for (const host of GIT_HOSTS) {
    try {
      const key = `credential.${host}.helper`;
      await execFileAsync("git", ["config", "--global", "--unset-all", key]).catch(() => {
      });
      await execFileAsync("git", ["config", "--global", "--add", key, ""]);
      await execFileAsync("git", ["config", "--global", "--add", key, helper]);
    } catch {
    }
  }
}

// dist/commands/login.js
function openBrowser(url) {
  const cmd2 = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
  exec(`${cmd2} "${url}"`);
}
var loginCommand = {
  name: "login",
  description: "Log in to IdeaSpaces (optional \u2014 required for sync)",
  usage: "ideaspaces login",
  examples: [
    "ideaspaces login              # OAuth login; saves credentials for git push/pull"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const apiUrl = getDefaultApiUrl();
    const callbackServer = await startCallbackServer();
    const authUrl = `${apiUrl}/auth/google?response_type=cli&port=${callbackServer.port}`;
    output.progress(`Opening browser for login...
${authUrl}`);
    openBrowser(authUrl);
    let token;
    try {
      token = await callbackServer.waitForCallback(12e4);
      callbackServer.close();
    } catch (err) {
      callbackServer.close();
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    saveCredentials({ api_url: apiUrl, api_key: token });
    await registerGitCredentialHelper();
    const webUrl = deriveWebBase(apiUrl);
    output.result({ logged_in: true, web_url: webUrl }, [
      "Logged in.",
      `View your account: ${webUrl}`,
      "`git push` / `git pull` against your space repos now picks up credentials automatically."
    ].join("\n"));
    return 0;
  }
};

// dist/commands/publish.js
import { spawnSync as spawnSync3 } from "node:child_process";
import { existsSync as existsSync5, statSync } from "node:fs";
import { basename as basename2, join as join9 } from "node:path";

// dist/auth/spaces.js
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join4, resolve as resolve3 } from "node:path";
function spacesFile() {
  return join4(configDir(), "spaces.json");
}
function loadSpaces() {
  const file = spacesFile();
  try {
    if (!existsSync4(file))
      return {};
    const raw = readFileSync2(file, "utf-8");
    const data = JSON.parse(raw);
    if (typeof data !== "object" || data === null)
      return {};
    return data;
  } catch {
    return {};
  }
}
function saveSpace(absolutePath, record) {
  const key = resolve3(absolutePath);
  const map = loadSpaces();
  map[key] = record;
  const dir = configDir();
  if (!existsSync4(dir)) {
    mkdirSync2(dir, { recursive: true, mode: 448 });
  }
  writeFileSync2(spacesFile(), JSON.stringify(map, null, 2) + "\n", { mode: 384 });
}
function findSpaceFor(absolutePath) {
  return loadSpaces()[resolve3(absolutePath)] ?? null;
}
function listClones() {
  return Object.entries(loadSpaces()).map(([path, record]) => ({ path, record }));
}
function removeSpace(absolutePath) {
  const key = resolve3(absolutePath);
  const map = loadSpaces();
  if (!(key in map))
    return false;
  delete map[key];
  const dir = configDir();
  if (!existsSync4(dir)) {
    mkdirSync2(dir, { recursive: true, mode: 448 });
  }
  writeFileSync2(spacesFile(), JSON.stringify(map, null, 2) + "\n", { mode: 384 });
  return true;
}

// dist/frontmatter-report.js
import { readFile } from "node:fs/promises";
import { relative as relative4 } from "node:path";

// node_modules/@ideaspaces/protocol/dist/space.js
import { promises as fs2 } from "node:fs";
import { dirname, join as join5, resolve as resolve4 } from "node:path";
var CONTRACT_FILES = [
  "foundation",
  "guide",
  "purpose",
  "now",
  "next"
];
async function isDirectory(path) {
  try {
    const stat = await fs2.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
async function readContract(agentDir) {
  const entries = {};
  await Promise.all(CONTRACT_FILES.map(async (name) => {
    const path = join5(agentDir, `${name}.md`);
    try {
      const content = await fs2.readFile(path, "utf-8");
      entries[name] = { path, content };
    } catch {
    }
  }));
  return entries;
}
async function composeContractAlongPath(position) {
  const start = resolve4(position);
  const found = [];
  let spaceRoot = null;
  let dir = start;
  while (true) {
    const agentDir = join5(dir, "_agent");
    if (await isDirectory(agentDir)) {
      const contract2 = await readContract(agentDir);
      found.push({ dir, contract: contract2 });
      if (contract2.foundation) {
        spaceRoot = dir;
        break;
      }
    }
    const parent = dirname(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  const contract = {};
  if (spaceRoot) {
    const rootEntry = found.find((f) => f.dir === spaceRoot)?.contract.foundation;
    if (rootEntry)
      contract.foundation = { ...rootEntry, level: spaceRoot };
  }
  for (const name of ["guide", "purpose", "now", "next"]) {
    for (const level of found) {
      const entry = level.contract[name];
      if (entry) {
        contract[name] = { ...entry, level: level.dir };
        break;
      }
    }
  }
  return { position: start, spaceRoot, contract, levels: found.map((f) => f.dir) };
}

// node_modules/@ideaspaces/protocol/dist/awareness.js
import { promises as fs3 } from "node:fs";
import { join as join6 } from "node:path";

// node_modules/@ideaspaces/protocol/dist/frontmatter.js
var import_yaml = __toESM(require_dist(), 1);
var DELIM = "---";
function stripFrontmatter(content) {
  const block = frontmatterBlock(content);
  if (!block)
    return content;
  return block.lines.slice(block.endLineIndex + 1).join("\n");
}
function inspectFrontmatterSyntax(content) {
  if (!startsFrontmatter(content))
    return { status: "none" };
  const block = frontmatterBlock(content);
  if (!block) {
    return {
      status: "malformed",
      message: "frontmatter block is missing closing ---",
      line: 1,
      column: 1
    };
  }
  const source = block.lines.slice(1, block.endLineIndex).map((line) => line.replace(/\r$/, "")).join("\n");
  const doc = (0, import_yaml.parseDocument)(source);
  const err = doc.errors[0];
  if (!err)
    return { status: "valid" };
  const linePos = err.linePos?.[0];
  return {
    status: "malformed",
    message: err.message,
    // YAML line 1 is content line 2 because line 1 is the opening delimiter.
    line: linePos ? linePos.line + 1 : void 0,
    column: linePos?.col
  };
}
function extractSummary(content) {
  return extractScalarField(content, "summary");
}
function extractDescription(content) {
  return extractScalarField(content, "description") ?? extractScalarField(content, "summary");
}
function extractScalarField(content, field) {
  if (!content.startsWith(`${DELIM}
`) && !content.startsWith(`${DELIM}\r
`)) {
    return null;
  }
  const lines = content.split(/\r?\n/);
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === DELIM) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1)
    return null;
  const prefix = `${field}:`;
  let summaryStart = -1;
  for (let i = 1; i < endIdx; i++) {
    if (lines[i].startsWith(prefix)) {
      summaryStart = i;
      break;
    }
  }
  if (summaryStart === -1)
    return null;
  const parts = [];
  const firstLineRaw = lines[summaryStart].slice(prefix.length).trim();
  if (firstLineRaw && !/^[>|][+-]?$/.test(firstLineRaw)) {
    parts.push(firstLineRaw);
  }
  for (let i = summaryStart + 1; i < endIdx; i++) {
    const line = lines[i];
    if (/^\s+\S/.test(line)) {
      parts.push(line.trim());
    } else {
      break;
    }
  }
  if (!parts.length)
    return null;
  let result = parts.join(" ");
  if (result.startsWith('"') && result.endsWith('"') || result.startsWith("'") && result.endsWith("'")) {
    result = result.slice(1, -1);
  }
  return result || null;
}
function composeFrontmatter(fm) {
  const lines = [DELIM];
  if (fm.name !== void 0)
    lines.push(`name: ${escapeScalar(fm.name)}`);
  if (fm.summary !== void 0)
    lines.push(`summary: ${escapeScalar(fm.summary)}`);
  if (fm.tags?.length)
    lines.push(...renderArray("tags", fm.tags));
  if (fm.attached_to !== void 0) {
    lines.push(`attached_to: ${escapeScalar(fm.attached_to)}`);
  }
  lines.push(DELIM, "");
  return lines.join("\n");
}
function escapeScalar(value) {
  if (needsQuoting(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}
function needsQuoting(value) {
  if (value === "")
    return true;
  if (/^[\s>|*&!%@`]/.test(value))
    return true;
  if (/^[-?]\s/.test(value))
    return true;
  if (/[:#]\s/.test(value))
    return true;
  if (/[{}[\],]/.test(value))
    return true;
  if (/[:#]$/.test(value))
    return true;
  if (/[\n\r"\\]/.test(value))
    return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(value))
    return true;
  if (/^-?\d/.test(value))
    return true;
  return false;
}
function renderArray(key, items) {
  return [`${key}:`, ...items.map((v) => `  - ${escapeScalar(v)}`)];
}
function startsFrontmatter(content) {
  return content.startsWith(`${DELIM}
`) || content.startsWith(`${DELIM}\r
`);
}
function frontmatterBlock(content) {
  if (!startsFrontmatter(content))
    return null;
  const lines = content.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === DELIM) {
      return { lines, endLineIndex: i };
    }
  }
  return null;
}

// node_modules/@ideaspaces/protocol/dist/git.js
import { spawn } from "node:child_process";
var FS = "";
var REC = "";
var DEFAULT_COMMIT_LIMIT = 20;
function runGit2(repoRoot2, args2) {
  return new Promise((resolve15) => {
    const proc = spawn("git", ["-C", repoRoot2, ...args2], {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let out = "";
    proc.stdout.on("data", (d) => out += d);
    proc.on("close", (code) => resolve15({ ok: code === 0, out }));
    proc.on("error", () => resolve15({ ok: false, out: "" }));
  });
}
async function lastCommitTime(repoRoot2, path) {
  const res = await runGit2(repoRoot2, ["log", "-1", "--format=%ct", "--", path]);
  if (!res.ok)
    return null;
  const t = parseInt(res.out.trim(), 10);
  return Number.isFinite(t) ? t : null;
}
async function gitState(repoRoot2) {
  const top = await runGit2(repoRoot2, ["rev-parse", "--show-toplevel"]);
  const root = top.ok ? top.out.trim() : repoRoot2;
  const headRes = await runGit2(root, ["rev-parse", "--verify", "HEAD"]);
  const headSha2 = headRes.ok ? headRes.out.trim() || null : null;
  const branchRes = await runGit2(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branchRaw = branchRes.ok ? branchRes.out.trim() : "";
  const branch = !branchRaw || branchRaw === "HEAD" ? null : branchRaw;
  let ahead = null;
  let behind = null;
  const upstream = await runGit2(root, [
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{upstream}"
  ]);
  if (upstream.ok && upstream.out.trim()) {
    const counts = await runGit2(root, [
      "rev-list",
      "--left-right",
      "--count",
      "@{upstream}...HEAD"
    ]);
    if (counts.ok) {
      const [b, a] = counts.out.trim().split(/\s+/).map((n) => parseInt(n, 10));
      if (Number.isFinite(b))
        behind = b;
      if (Number.isFinite(a))
        ahead = a;
    }
  }
  const status = await runGit2(root, ["status", "--porcelain"]);
  let dirty = false;
  const untrackedInTrackedDirs = [];
  if (status.ok) {
    for (const line of status.out.split("\n")) {
      if (!line)
        continue;
      if (line.startsWith("??")) {
        const path = line.slice(3).trim();
        if (path && !path.endsWith("/"))
          untrackedInTrackedDirs.push(path);
      } else {
        dirty = true;
      }
    }
  }
  return { repoRoot: root, headSha: headSha2, branch, ahead, behind, dirty, untrackedInTrackedDirs };
}
async function recentActivity(repoRoot2, sinceSha, limit = DEFAULT_COMMIT_LIMIT) {
  const selector = sinceSha ? [`${sinceSha}..HEAD`] : [`-n`, String(limit)];
  const res = await runGit2(repoRoot2, [
    "log",
    ...selector,
    "--name-status",
    `--format=${REC}%H${FS}%s${FS}%cI${FS}%an`
  ]);
  if (!res.ok)
    return { commits: [], changedFiles: [] };
  const commits = [];
  const seen = /* @__PURE__ */ new Set();
  const changedFiles = [];
  for (const raw of res.out.split("\n")) {
    if (!raw)
      continue;
    if (raw.startsWith(REC)) {
      const [sha, subject, date, author] = raw.slice(1).split(FS);
      commits.push({ sha, subject, date, author });
      continue;
    }
    const parts = raw.split("	");
    if (parts.length < 2)
      continue;
    const status = parts[0][0];
    const path = parts[parts.length - 1];
    if (seen.has(path))
      continue;
    seen.add(path);
    changedFiles.push({ status, path });
  }
  return { commits, changedFiles };
}

// node_modules/@ideaspaces/protocol/dist/awareness.js
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "_agent",
  "node_modules",
  ".git",
  ".github",
  ".vscode",
  ".idea",
  "dist",
  "build"
]);
var CONTRACT_ORDER = ["foundation", "guide", "purpose", "now", "next"];
async function assembleAwareness(opts) {
  const { root, contract, lastSha, maxChanges = 15, nowExcerptLength = 200, summaryExcerptLength = 200 } = opts;
  const sections = [];
  const nowLine = extractNowLine(contract, nowExcerptLength);
  if (nowLine)
    sections.push(`Now: ${nowLine}`);
  const tree = await buildTreeSection(root);
  if (tree)
    sections.push(tree);
  const agentContext = buildAgentContextSection(contract, summaryExcerptLength);
  if (agentContext)
    sections.push(agentContext);
  const skills = await buildSkillsSection(root, summaryExcerptLength);
  if (skills)
    sections.push(skills);
  if (lastSha) {
    const { changedFiles } = await recentActivity(root, lastSha);
    if (changedFiles.length) {
      const total = changedFiles.length;
      const head = changedFiles.slice(0, maxChanges);
      const lines = [`Since last session (${total} changes):`];
      for (const c of head)
        lines.push(`  ${c.status}	${c.path}`);
      if (total > maxChanges)
        lines.push(`  ... and ${total - maxChanges} more`);
      sections.push(lines.join("\n"));
    }
  }
  return sections.join("\n\n");
}
function buildAgentContextSection(contract, max) {
  const present = CONTRACT_ORDER.filter((name) => contract[name]);
  if (!present.length)
    return null;
  const lines = ["Agent context:"];
  for (const name of present) {
    const entry = contract[name];
    const blurb = describeFile(entry.content, max);
    lines.push(blurb ? `  ${name} \u2014 ${blurb}` : `  ${name}`);
  }
  return lines.join("\n");
}
async function buildSkillsSection(root, max) {
  const skillsDir = join6(root, "_agent", "skills");
  let entries;
  try {
    entries = (await fs3.readdir(skillsDir)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return null;
  }
  if (!entries.length)
    return null;
  const blurbs = await Promise.all(entries.map(async (file) => {
    try {
      const content = await fs3.readFile(join6(skillsDir, file), "utf-8");
      return describeFile(content, max);
    } catch {
      return null;
    }
  }));
  const lines = ["Operating skills:"];
  for (let i = 0; i < entries.length; i++) {
    const name = entries[i].replace(/\.md$/, "");
    const blurb = blurbs[i];
    lines.push(blurb ? `  ${name} \u2014 ${blurb}` : `  ${name}`);
  }
  return lines.join("\n");
}
function describeFile(content, max) {
  const summary = extractSummary(content);
  if (summary)
    return truncate(summary, max);
  const body = stripFrontmatter(content);
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#"))
      continue;
    return truncate(line, max);
  }
  return null;
}
function extractNowLine(contract, max) {
  if (!contract.now)
    return null;
  const body = stripFrontmatter(contract.now.content);
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line)
      continue;
    if (line.startsWith("#"))
      continue;
    if (line.startsWith(">")) {
      const stripped = line.replace(/^>+\s*/, "").trim();
      if (stripped)
        return truncate(stripped, max);
      continue;
    }
    return truncate(line, max);
  }
  return null;
}
function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max).trimEnd()}\u2026`;
}
async function buildTreeSection(root) {
  let entries;
  try {
    const dirents = await fs3.readdir(root, { withFileTypes: true });
    entries = dirents.filter((e) => !e.name.startsWith(".") || e.name === ".gitignore").map((e) => ({ name: e.name, isDir: e.isDirectory() }));
  } catch {
    return null;
  }
  const dirs = entries.filter((e) => e.isDir && !SKIP_DIRS.has(e.name)).map((e) => e.name).sort();
  const files = entries.filter((e) => !e.isDir && e.name.endsWith(".md")).map((e) => e.name).sort();
  if (!dirs.length && !files.length)
    return null;
  const totalFiles = await countMarkdown(root);
  const lines = [`Tree (${totalFiles} files):`];
  for (const d of dirs) {
    const count = await countMarkdown(join6(root, d));
    lines.push(count ? `  ${d}/ (${count})` : `  ${d}/`);
  }
  for (const f of files)
    lines.push(`  ${f}`);
  return lines.join("\n");
}
async function countMarkdown(dir) {
  let count = 0;
  let dirents;
  try {
    dirents = await fs3.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of dirents) {
    if (entry.name.startsWith("."))
      continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name))
        continue;
      count += await countMarkdown(join6(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      count += 1;
    }
  }
  return count;
}

// node_modules/@ideaspaces/protocol/dist/path-context.js
import { promises as fs4 } from "node:fs";
import { isAbsolute, join as join7, relative as relative2, resolve as resolve5, sep } from "node:path";
function spaceRootLevel(ctx) {
  return ctx.levels.find((l) => l.foundation) ?? null;
}
function currentBranchLevel(ctx) {
  for (let i = ctx.levels.length - 1; i >= 0; i--) {
    if (ctx.levels[i].hasAgent)
      return ctx.levels[i];
  }
  return null;
}
async function walkPathContext(repoRoot2, currentPath, opts = {}) {
  const { includeContent = false } = opts;
  const root = resolve5(repoRoot2);
  const rel = relative2(root, resolve5(root, currentPath));
  const segments = rel === "" || rel.startsWith("..") || isAbsolute(rel) ? [] : rel.split(sep).filter(Boolean);
  const relPaths = [""];
  let acc = "";
  for (const segment of segments) {
    acc = acc ? `${acc}/${segment}` : segment;
    relPaths.push(acc);
  }
  const levels = await Promise.all(relPaths.map((relPath) => readLevel(root, relPath, includeContent)));
  const position = segments.join("/");
  return { position, levels };
}
async function readLevel(root, relPath, includeContent) {
  const absPath = relPath ? join7(root, relPath) : root;
  const agentDir = join7(absPath, "_agent");
  const [hasAgent, readme] = await Promise.all([
    isDirectory2(agentDir),
    readFileOrNull(join7(absPath, "README.md"))
  ]);
  let contract = {};
  if (hasAgent)
    contract = await readContract(agentDir);
  const agentFiles = CONTRACT_FILES.filter((f) => contract[f]);
  const contractSummaries = {};
  for (const f of agentFiles) {
    const summary = describe(contract[f].content);
    if (summary)
      contractSummaries[f] = summary;
  }
  return {
    path: relPath,
    absPath,
    hasAgent,
    foundation: Boolean(contract.foundation),
    agentFiles,
    contractSummaries,
    readmeSummary: readme ? describe(readme) : null,
    readmeContent: includeContent ? readme : null,
    contract: includeContent && hasAgent ? contract : null
  };
}
function describe(content) {
  const summary = extractSummary(content);
  if (summary)
    return summary;
  for (const raw of stripFrontmatter(content).split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#"))
      continue;
    return line.replace(/^>+\s*/, "").trim() || null;
  }
  return null;
}
async function isDirectory2(path) {
  try {
    return (await fs4.stat(path)).isDirectory();
  } catch {
    return false;
  }
}
async function readFileOrNull(path) {
  try {
    return await fs4.readFile(path, "utf-8");
  } catch {
    return null;
  }
}

// node_modules/@ideaspaces/protocol/dist/stale-docs.js
var import_yaml2 = __toESM(require_dist(), 1);
import { promises as fs5 } from "node:fs";
import { join as join8, relative as relative3, resolve as resolve6 } from "node:path";
var SKIP_DIRS2 = /* @__PURE__ */ new Set(["node_modules", ".git", "dist", "build"]);
async function collectDocDependencies(repoRoot2, docDir) {
  const root = resolve6(repoRoot2);
  const start = resolve6(root, docDir);
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = (await fs5.readdir(dir, { withFileTypes: true })).map((e) => ({
        name: e.name,
        isDir: e.isDirectory()
      }));
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith("."))
        continue;
      const abs = join8(dir, entry.name);
      if (entry.isDir) {
        if (!SKIP_DIRS2.has(entry.name))
          await walk(abs);
      } else if (entry.name.endsWith(".md")) {
        const content = await readFileOrNull2(abs);
        if (!content)
          continue;
        const codePaths = readCodePaths(content);
        if (codePaths.length) {
          out.push({ path: relative3(root, abs), codePaths });
        }
      }
    }
  }
  await walk(start);
  return out;
}
async function staleDocSignals(repoRoot2, docs) {
  const root = resolve6(repoRoot2);
  const signals = [];
  for (const { path, codePaths } of docs) {
    const missing = [];
    for (const code of codePaths) {
      if (!await exists(join8(root, code)))
        missing.push(code);
    }
    if (missing.length)
      signals.push({ kind: "broken", doc: path, missing });
    const docTime = await lastCommitTime(repoRoot2, path);
    if (docTime == null)
      continue;
    let newestCode = "";
    let codeTime = -1;
    for (const code of codePaths) {
      if (missing.includes(code))
        continue;
      const t = await lastCommitTime(repoRoot2, code);
      if (t != null && t > codeTime) {
        codeTime = t;
        newestCode = code;
      }
    }
    if (codeTime < 0)
      continue;
    if (codeTime > docTime) {
      signals.push({
        kind: "stale",
        doc: path,
        docTime,
        newestCode,
        codeTime,
        staleBySeconds: codeTime - docTime
      });
    }
  }
  return signals;
}
function readCodePaths(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n"))
    return [];
  const lines = content.split(/\r?\n/);
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1)
    return [];
  try {
    const data = (0, import_yaml2.parseDocument)(lines.slice(1, end).join("\n")).toJSON();
    const raw = data?.code_paths;
    if (Array.isArray(raw))
      return raw.filter((x) => typeof x === "string");
    if (typeof raw === "string")
      return [raw];
    return [];
  } catch {
    return [];
  }
}
async function readFileOrNull2(path) {
  try {
    return await fs5.readFile(path, "utf-8");
  } catch {
    return null;
  }
}
async function exists(path) {
  try {
    await fs5.stat(path);
    return true;
  } catch {
    return false;
  }
}

// node_modules/@ideaspaces/protocol/dist/skill-catalog.generated.js
var SKILL_CATALOG = {
  "awareness": `---
name: awareness
description: >
  Check alignment between declared understanding and actual state at any position.
  Use after substantive work \u2014 multiple writes, restructuring, perspective application \u2014
  or when asked "is this still accurate?", "has this drifted?", "does the README match?".
  The protocol: read declarations, read reality, compare, propose updates or stay silent.
---

# Awareness \u2014 Delta Protocol

After substantive changes at a position, check whether the shared understanding still holds \u2014 does the declared understanding match reality? Drift is the default. Recalibration is the work.

## When to Run

- After writing multiple Notes in a branch
- After restructuring (moving files, creating new branches)
- After applying perspectives that produce new content
- At session start, if the branch has been active recently
- When something feels off \u2014 the content doesn't match the branch description

## The Protocol

### 1. Read Declarations

At the current position, read what's declared:

- \`_agent/purpose.md\` \u2014 why this place exists
- \`_agent/now.md\` \u2014 what we're focused on
- \`_agent/guide.md\` \u2014 how to work here
- \`README.md\` \u2014 what this branch is about

Read each one. Some may not exist \u2014 that's information too (a branch without purpose is directionless).

### 2. Read Reality

What actually exists here:

- recent changes \u2014 what changed recently in this subtree
- the tree at this position \u2014 what children exist, how many files, what they're about
- the actual content of this directory \u2014 what the material here is really about

**Before asserting that something "shipped" / "is implemented" / "is pending" from a doc, check the code \u2014 and the code may live in a *different repo*.** A space often spans several repos in the active context: a doc describing access control may sit in a docs repo while the implementation lives in a code repo. Locate the code wherever it is (grep/search across the repos in context), read its git history, and compare timestamps to the doc. Don't trust a doc's status line on its own \u2014 verify against the actual code, even when that means looking outside this repo. (The session-start drift block flags *same-repo* staleness automatically; cross-repo staleness is yours to check by reasoning, since you have git and know the repos in play.)

### 3. Compare

For each declaration, ask: does this still match?

| Declaration | Delta question |
|---|---|
| README.md says "this branch is about X" | Are the children actually about X? |
| purpose.md says "we're here because Y" | Does recent work serve Y? |
| now.md says "focused on Z" | Is Z done? Changed? Superseded? |
| guide.md says "work this way" | Is the guidance still relevant? |

### 4. Output

**If aligned:** Say nothing. Don't generate a report for the sake of reporting.

**If drifted:** Propose a specific change. Not an essay \u2014 a concrete edit:

- "now.md says 'evaluate 20 companies' but 18 are done. Propose update: 'Finalize remaining 2 evaluations, then synthesize patterns across the batch.'"
- "README says 'early stage startups' but 4 of 8 Notes are Series B. Either update README or consider splitting the branch."
- "No purpose.md at this branch. Based on content, this is about regulatory risk in health-tech. Want me to create one?"

Keep it terse. The user decides whether to accept the proposal.

## What This Is Not

- **Not memory.** The skill doesn't save facts or accumulate knowledge. It proposes changes to the Space's scaffolding.
- **Not a report.** Don't generate awareness reports. Either there's drift to surface or there isn't.
- **Not mandatory.** The agent uses judgment about when to run this. After a single quick edit, skip it. After a deep restructuring session, run it.
`,
  "capture": `---
name: capture
description: >
  Draw out understanding through conversation, crystallize into Notes that
  compound. Use when the user wants to persist knowledge, save what's been
  discussed, or capture expertise from conversation.
---

# Capture

Draw out understanding through conversation, crystallize into Notes that compound.

## Elicitation

Indirect over direct. "Tell me about a case you evaluated recently" reveals real criteria \u2014 "What's your evaluation framework?" gets generic answers. Comparison reveals dimensions users can't name. Reflect to refine \u2014 each reflection is a checkpoint. Probe decision points: "What made this difficult?" Know when to stop: circling means ready to crystallize.

## Crystallization

Too early loses nuance, too late loses coherence. Ready: clarity reached, same points recurring. Not ready: still exploring, contradictions unresolved. Offer, don't announce: "I think I have enough to structure this. Want to see?"

## Writing Standard

Notes are retrieval artifacts \u2014 what you write now serves a future search.

- **Signal density** \u2014 one clear thing per sentence. "Revenue grew 40% in Q3" not "significant growth."
- **Summary first** \u2014 orient immediately, dense with meaning, stands alone. It is what a reader and a search see first.
- **Self-contained sections** \u2014 each independently meaningful. No "as mentioned above." Headings are contracts.
- **Fact vs interpretation** \u2014 distinguish, attribute, never blend. Gaps are information.
- **Progressive disclosure** \u2014 title \u2192 summary \u2192 sections. Each level adds detail without contradicting.

## Workflow

1. Elicit understanding through conversation
2. Recognize crystallization readiness
3. Draft \u2014 show the user before persisting
4. User reviews, iterates, approves
5. Persist with tags (retrieval decisions) and references (provenance)

## URL Capture

Fetch a page as markdown. From there: save directly as a Note, transform through a Perspective, or use in conversation. If fetching fails (site blocks, fetcher down), ask the user for the content directly. Structure it the same way.

## Placement

The directory tree is the structure. Place Notes where they compound with related content \u2014 the path IS the context.

**Before placing:**
1. Check the tree (loaded from your current position). What branches exist, how deep, what READMEs say.
2. Prefer existing locations. New directories only when nothing fits.
3. When many Notes share a tag, that's accumulation pressure \u2014 the tag may deserve to become a directory.

**Tags** are descriptors for filtered search \u2014 not location. The path is location. Look at what tags already exist before tagging. 1-3 tags per Note. Reuse existing tags first.

**Show your reasoning.** "I'd place this under \`venture/climate-tech/\` because your README there focuses on deep-tech teams with regulatory tailwinds, which matches this company."

## Multiple Notes

A conversation can produce multiple Notes. When the discussion covers distinct topics, draft each one separately. Each Note gets its own name, content, tags, and summary. Don't merge distinct ideas into one Note \u2014 self-contained sections within a Note is fine, but separate topics deserve separate Notes.
`,
  "form-perspective": `---
name: form-perspective
description: >
  Codify a reusable thinking pattern through progressive elicitation. Use when
  the user wants to make their evaluation criteria, analysis framework, or
  judgment process repeatable and consistent.
---

# Form Perspective

Codify a reusable thinking pattern through progressive elicitation.

## Three Required Components

Elicit progressively \u2014 don't demand all at once:

1. **Object Definition** \u2014 what gets analyzed. Clear boundaries. What's in scope, what's not.
2. **Thinking Structure** \u2014 operationalized criteria, sequenced attention, decision rules. Not "strong team" but "relevant exits + domain expertise + technical depth in the problem domain."
3. **Expected Outcome** \u2014 section structure, detail level, conclusion format. What the output Note looks like.

## Operationalization

The gap between intention and execution is where Perspectives fail. "Evaluate the team" is intention. "For each team member: relevant exits (count, scale, domain), domain expertise (years, publications, prior companies), role fit (technical depth vs problem complexity)" \u2014 that's operationalized.

Push every criterion until it's testable. If two people applying this Perspective would produce different results, it's not operationalized enough.

## Workflow

1. Understand what the user wants to make repeatable
2. Elicit examples \u2014 "Tell me about a time you evaluated this well"
3. Extract the implicit criteria from the examples
4. Draft \u2014 show the Perspective definition before persisting
5. Validate: would this produce the right output on a real case?
6. Persist as a Perspective

## Reference Material

Look for existing Notes that exemplify good and bad cases, and read them. Real examples ground the Perspective in the user's actual thinking, not abstract criteria.
`,
  "form-primitive": '---\nname: form-primitive\ndescription: >\n  Help users create reusable agent instructions \u2014 procedures, checklists,\n  review patterns, memory routines, or any repeatable pattern. Use when the\n  user wants to define how the agent should work in specific situations.\n  Produces a file in _agent/ with name + description frontmatter.\n---\n\n# Form Primitive\n\nHelp the user create a reusable instruction that shapes how you work together. Not a Perspective (those have a specific three-component structure and are applied as a structured transformation). A primitive is any part of `_agent/` \u2014 a procedure, a checklist, a review pattern, a memory routine, whatever helps at that position.\n\n## The L1 Contract\n\nEvery primitive needs frontmatter with `name` and `description`. The description tells the agent when to use it \u2014 like a trigger condition.\n\n```yaml\n---\nname: Weekly Review\ndescription: >\n  Review the week\'s captures, surface patterns, update Now.\n  Use at the end of each week or when the user asks to reflect.\n---\n```\n\nThe name says what it is. The description says when to use it. Both are required. Both show up when browsing the tree. The description is how the agent decides "this is relevant right now."\n\n## Elicitation\n\nThe user knows what they want to make repeatable. They may not know how to structure it.\n\n1. **Start with the trigger.** "When does this happen? What situation makes you think \'I should do X\'?" This becomes the description.\n\n2. **Walk through a real instance.** "Last time you did this, what did you do step by step?" Real examples beat abstract procedures.\n\n3. **Find the invariant.** What stays the same every time vs what changes with context? The invariant is the instruction. The variable parts are what the agent adapts.\n\n4. **Draft and validate.** Show the primitive before saving. "If I followed this next time, would it produce the right behavior?"\n\n## Structure\n\nNo prescribed format. The content should be whatever makes the instruction clear and followable. Common patterns:\n\n**Procedural** \u2014 step by step:\n```markdown\n## When to use\n[trigger condition]\n\n## Steps\n1. ...\n2. ...\n3. ...\n\n## Output\n[what gets produced]\n```\n\n**Checklist** \u2014 verify against criteria:\n```markdown\n## Check\n- [ ] Does it have X?\n- [ ] Is Y consistent with Z?\n- [ ] Flag if A but not B.\n\n## If issues found\n[what to do]\n```\n\n**Routine** \u2014 recurring pattern:\n```markdown\n## Trigger\n[when this runs \u2014 weekly, on entering a position, on capture, etc.]\n\n## What to do\n[the routine]\n\n## What to capture\n[what Note or update to produce]\n```\n\n**Review** \u2014 evaluate something:\n```markdown\n## What to review\n[scope \u2014 a Note, a branch, a set of captures]\n\n## Criteria\n[what good looks like]\n\n## Output\n[Note with findings, or update to the reviewed content]\n```\n\nThe user can invent any structure. These are starting points, not requirements.\n\n## Where It Lives\n\nPrimitives go in `_agent/` at the level where they apply. Everything in `_agent/` composes along the path, root \u2192 current position:\n\n- `_agent/reviewer.md` at repo root \u2192 applies everywhere\n- `startups/_agent/due-diligence-checklist.md` \u2192 applies in startups/ and below\n- `clients/acme/_agent/communication-style.md` \u2192 applies when working on Acme\n\n## Creating Agents\n\nA special case of primitive: a full agent definition. When the user wants a specialized agent (not just an instruction), create `_agent/{agent-name}/agent.md`:\n\n```yaml\n---\nname: "Regulatory Analyst"\ntools: ["read", "write", "search", "git"]\n---\n\nAn agent specialized in regulatory risk analysis. Evaluates compliance\nrequirements, flags regulatory gaps, tracks regulatory changes.\n```\n\nThe optional `tools` field restricts which tools the agent can use. Omit it for full access. The body describes what the agent does.\n\nAlso create `_agent/{agent-name}/soul.md` to define how the agent shows up \u2014 its character and approach. And optionally `purpose.md` and `now.md` for the agent\'s own direction. The agent becomes available for conversations once these files exist.\n\n## What It Is NOT\n\n- **Not a Perspective.** Perspectives have Object Definition, Thinking Structure, Expected Outcome. They\'re applied as a structured transformation. If the user wants to evaluate/analyze things consistently, use the **form-perspective** skill instead.\n- **Not a Note.** Notes are knowledge \u2014 content that accumulates in the Space. Primitives are instructions \u2014 they shape how the agent works, not what the agent knows.\n- **Not guide.md.** The guide is general behavioral guidance for a branch. A primitive is a specific, named, reusable pattern with a trigger condition. Both live in `_agent/` \u2014 both are part of the shared understanding about how we work here.\n\n## Validation\n\nBefore saving, check:\n- Does it have `name` and `description` in frontmatter?\n- Does the description clearly say when to use it?\n- Is the instruction clear enough that you could follow it without asking questions?\n- Would it produce consistent results across different situations?\n\nIf any of these fail, iterate with the user before persisting.\n',
  "guide": "---\nname: guide\ndescription: >\n  How to establish and maintain shared understanding at any position.\n  Always in awareness. Use when: a new folder has no _agent/, the user\n  asks what this place is for, purpose or now feel stale, or the\n  shared understanding needs renegotiating.\n---\n\n# Guide\n\n`_agent/` is how we work here, as far as we've figured it out.\nFoundation, guide, purpose, now, next \u2014 when any of them contradict\ncurrent practice, or go silent on something we keep doing \u2014 surface\nit. Propose an update. The understanding maintains itself through use.\n\n## What to pay attention to\n\nEvery position has dimensions that shape how we work here:\n\n| Dimension | File | The question |\n|---|---|---|\n| What is this place | README.md | Does the contract match what's actually here? |\n| Why does it exist | `_agent/purpose.md` | Clear direction, or still emerging? |\n| What's active | `_agent/now.md` | Concrete and current, or stale? |\n| What's queued | `_agent/next.md` | Identified, even if vague? |\n| How we work here | `_agent/guide.md` | Scope-specific, beyond foundation? |\n\nNot every position needs all of them. A deep branch might only need\na README. Root usually carries more. Each dimension can be empty,\nemerging, established, or drifted.\n\nMost turns you're just working. The guide posture is background\nawareness \u2014 you notice the state of these dimensions while doing\nother things. When a gap matters, you feel it: the user is making\ndecisions without a purpose to anchor them, or now describes work\nthat's already done. That's when to surface it.\n\n## When a position is fresh\n\nStart with the user, not the system. \"What kind of work happens\nhere?\" \u2014 not \"Let me set up your _agent/ folder.\"\n\nCapture something real first. The best onboarding is a Note that\nmatters, sitting in a directory that makes sense. Structure follows\ncontent. One branch, one real thing. Depth follows use, not planning.\n\nWhen you have enough signal about what this place is \u2014 propose.\nPreview before writing. The user confirms, edits, or starts smaller.\nNothing writes without agreement.\n\n## The readiness check\n\nBefore every capture \u2014 writing a Note, updating purpose, creating\na README \u2014 pause. \"I'm about to commit X. Is this what you mean?\"\n\nThe readiness check is the anti-hallucination primitive. Hallucination\nis what happens when either side commits before both are ready.\n\n## What this guide does not cover\n\nTools self-describe. Domain skills (founder, vc, research) add their\nown structure. Platform setup (auth, hooks, sync) is handled by\nsetup skills. This guide is about shared understanding \u2014 how you\nand the user figure out what this place is and keep that agreement\nhonest.\n",
  "purpose-elicitation": `---
name: purpose-elicitation
description: >
  Help articulate the repo's North Star \u2014 why this place exists and where
  it's heading. Use when working on _agent/purpose.md, when purpose is
  missing, or when the user asks about direction, goals, or what matters.
---

# Purpose Elicitation

Help the user articulate why this Space exists and where it's heading.

## What Purpose Is

Purpose is the North Star \u2014 the organizing principle that makes every other decision easier. "Should I capture this?" becomes answerable when you know what this place is for. Purpose isn't a mission statement. It's a working document that evolves.

## Elicitation Approach

Don't ask "What's your purpose?" \u2014 that produces generic answers. Instead:

- **Start with what's here.** Look at existing Notes, branches, perspectives. "You have 30 Notes about climate-tech startups and 5 about regulatory frameworks. What connects these?"
- **Surface through contrast.** "What would NOT belong here?" reveals boundaries better than "What belongs?"
- **Find the decision test.** "When you're deciding whether to capture something, what makes you say yes?" The answer is the purpose in operational form.
- **Listen for energy.** What the user talks about with most specificity and excitement is often the real purpose, even if their stated purpose is different.

## Structure

Purpose typically has three layers:

1. **What this place is for** \u2014 the domain, the scope, the boundary
2. **Where it's heading** \u2014 the direction, what "more" looks like
3. **The decision test** \u2014 how to know if something belongs

## Writing It

Keep it short. A paragraph or two. Written in the user's voice, not formal language. It should feel like the user explaining their Space to a friend.

Persist to \`_agent/purpose.md\` \u2014 this loads at session start and orients every conversation.

## When Purpose Is Missing

If \`_agent/purpose.md\` doesn't exist and the Space has content, the content itself is evidence. Read a few Notes, look at the tree structure, and reflect what you see: "Based on what's here, this Space seems focused on X. Is that right?" Let the user correct and refine.

If the Space is empty, explore what the user wants to build: "What kind of knowledge do you want to accumulate here?"
`,
  "repo-context": `---
name: repo-context
description: >
  Help describe what this place is and who works here. Use when working on
  _agent/repo-context.md, when onboarding to a new repo, or when the agent
  needs to understand the repo's identity.
---

# Repo Context

Help the user describe what this Space is and who works here.

## What Repo Context Is

Repo context is the "What" and "Who" \u2014 it tells the agent what kind of place this is. A personal research repo, a team knowledge base, a client portfolio tracker. It shapes how the agent speaks, what it assumes, and how it names things.

## What to Include

- **What this place is** \u2014 domain, scope, what kind of knowledge lives here
- **Who works here** \u2014 individual, team, organization. How they think about their work.
- **Vocabulary** \u2014 terms that mean specific things here. "Deal" might mean venture investment or sales opportunity depending on context.
- **Conventions** \u2014 naming patterns, preferred structure, anything the agent should follow

## Elicitation

If the user hasn't written repo context yet:

1. Look at existing content \u2014 tree structure, Note names, README files
2. Reflect what you see: "This looks like a personal research space focused on X"
3. Ask what's missing from that picture
4. Draft and refine together

## Writing It

Concise. A few paragraphs. Written for the agent \u2014 this loads at session start and orients every conversation. Focus on what would change the agent's behavior: vocabulary, assumptions, conventions.

Persist to \`_agent/repo-context.md\`.
`,
  "writing": '---\nname: writing\ndescription: >\n  Writing standard for Notes. Structure for retrieval, summaries for discovery,\n  entities for connection. Use when creating or substantially revising Notes,\n  or when asked "write this well", "capture this", "create a Note about".\n  Derived from Strunk & White, Zinsser, Kovach & Rosenstiel.\n---\n\n# Writing Standard\n\nNotes that compound follow these principles. They\'re functional requirements for knowledge that works \u2014 clear writing is easy to find and reuse, dense summaries drive discovery, well-scoped sections make a Note precise to navigate and search.\n\nDerived from Strunk & White, Zinsser, Kovach & Rosenstiel.\n\n## Summary Is Everything\n\nThe `summary` field is the most important thing you write. It\'s what search results show. It\'s what shows when browsing the tree. It\'s what loads in awareness context. Write it like the first thing someone reads \u2014 because it is.\n\nTwo sentences max. Dense. Immediate orientation. "What is this and why does it matter." Early words carry disproportionate weight \u2014 they anchor how the Note reads and how it is found.\n\n## Conciseness (Strunk & White)\n\n"Omit needless words." Every word in a Note earns its place.\n\n| Padded | Clean |\n|--------|-------|\n| "The question as to whether" | "Whether" |\n| "This is a company that" | "This company" |\n| "It is important to note that" | (delete \u2014 just state it) |\n| "In terms of revenue growth" | "Revenue grew" |\n\nActive voice over passive. "The startup was analyzed" \u2192 "We analyzed the startup." Passive only when the actor is unknown or irrelevant.\n\n## Clarity (Zinsser)\n\n"Clear thinking becomes clear writing." If you can\'t write it clearly, you don\'t understand it yet.\n\n- Strip every sentence to its cleanest components\n- Clutter words add nothing: "basically," "actually," "in order to," "at this point in time"\n- The first paragraph orients the reader immediately \u2014 if someone reads only the summary, they know what this is about\n\n## Concreteness\n\nSpecifics connect a Note to related specifics; abstractions blur those connections.\n\n| Abstract | Concrete |\n|----------|----------|\n| "Significant growth" | "Revenue grew 40% in Q3" |\n| "Strong team" | "3 ex-Google engineers, 2 successful exits" |\n| "Large market" | "$4.2B TAM, growing 25% annually" |\n\nPrefer the specific to the general, the definite to the vague. Concrete facts can be abstracted later. You can\'t recover specifics from abstractions.\n\n## Objectivity (Kovach & Rosenstiel)\n\nDistinguish fact from interpretation. Never blend them.\n\n| Type | Example |\n|------|---------|\n| Fact | "Raised $10M Series A in March 2025" |\n| Interpretation | "The funding suggests investor confidence" |\n| Claim (attributed) | "The CEO states they are \'market leaders\'" |\n\nEvery claim traces to a source. "According to the landing page..." or "The pitch deck states..." \u2014 the reader knows provenance.\n\n**What the agent does NOT do:** verify claims, add information not in the source, editorialize ("impressive team"), fill gaps with plausible content. If the source doesn\'t mention revenue, note the absence \u2014 don\'t guess.\n\n## Well-Scoped Sections\n\nEach `## heading` scopes one distinct point. Well-scoped sections = precise navigation and search.\n\n- A Note with five distinct sections makes five findable, comparable points\n- A wall of text blurs into one undifferentiated block \u2014 hard to find, hard to compare\n- Each section makes a complete point independently\n- Headings are contracts \u2014 "Team Analysis" contains team analysis, not market commentary\n- Target: 3-10 paragraphs per section. Too short = insufficient signal. Too long = diluted topic.\n\nProgressive disclosure: Title \u2192 Summary \u2192 Sections. Each level complete at its depth.\n\n## Primary Attachment\n\nUse `attached_to` for the one thing this Note is primarily about \u2014 like putting a sticky note on an object. It is singular: choose zero or one primary anchor, written `<type>:<id>`.\n\nThe type vocabulary is your platform\'s \u2014 the protocol fixes only the `<type>:<id>` shape. Common types a platform resolves might include a person (`person:alice`), an agent (`agent:assistant`), or a web page (`web_page:https://example.com/report.pdf`).\n\nIf the Note mentions several things, don\'t put all of them in `attached_to`. Choose the primary anchor, split the Note, use tags, or link in prose. Use `references` only for hard sources.\n\n## Cross-Note Links\n\nUse standard markdown links with relative paths for reader navigation. They are portable across editors, Obsidian, print/exports, and plain LLM context.\n\n```markdown\nSee [Acme profile](../companies/acme.md) for background.\nSee [Market map](../markets/README.md) for the branch overview.\n```\n\nPath links are user-facing handles. They may break when the target is renamed unless the editor/tool rewrites them; use editor rename refactors when available. Inline prose links are reader navigation, not provenance \u2014 they don\'t populate `references`.\n\nWhen renaming a Note and heavily rewriting it, commit the rename separately from the rewrite. Git rename detection is similarity-based; a rename plus large content change in one commit can defeat it, losing the file\'s history link.\n\n## Sources and References\n\nUse `references` only for hard sources: the small set of Notes this Note was produced from or grounded in. Perspective outputs and synthesis Notes use `references` for their input Notes. If a Note merely mentions or points to another Note, use an inline markdown link instead.\n\n## Sentence-Level Mechanics\n\n- **Put emphatic words at the end.** "In Q3, revenue grew 40%" not "Revenue is what grew 40% in Q3"\n- **Keep related words together.** Don\'t separate subject and verb with long interruptions\n- **Parallel construction.** "Fast, reliable, and affordable" not "speed, being reliable, and costs less"\n- **One idea per sentence.** Most of the time, two sentences are clearer than one compound one\n\n## Common Failure Modes\n\n- **Throat-clearing.** "Before we dive into the analysis..." \u2014 delete, start with the analysis\n- **Hedge stacking.** "It seems like it might possibly be somewhat relevant" \u2014 state or acknowledge uncertainty once\n- **Elegant variation.** If it\'s a "startup" in paragraph one, don\'t call it a "venture" in paragraph two for variety. Consistency aids findability.\n- **Nominalization.** "Make a determination" \u2192 "determine." "Performed an analysis" \u2192 "analyzed."\n- **Weasel words.** "Some experts say," "studies show" \u2014 without attribution, these are noise\n\n## The Standard\n\nKnowledge capture succeeds when:\n\n1. A human can scan the output and orient in seconds\n2. A machine can index the output and retrieve it precisely\n3. Every sentence traces to a source or is explicitly marked as interpretation\n4. Nothing is added that wasn\'t in the input\n5. Nothing important from the input is lost without acknowledgment\n6. The reader trusts the capture because the method is transparent\n'
};

// node_modules/@ideaspaces/protocol/dist/skills.js
async function listSkills() {
  return Object.keys(SKILL_CATALOG).sort().map((name) => ({ name, description: extractDescription(SKILL_CATALOG[name]) }));
}
async function readSkill(name) {
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new Error(`Invalid skill name: ${name}`);
  }
  const content = SKILL_CATALOG[name];
  if (content === void 0)
    throw new Error(`Unknown skill: ${name}`);
  return { name, description: extractDescription(content), content };
}

// node_modules/@ideaspaces/protocol/dist/conformance.js
var import_yaml3 = __toESM(require_dist(), 1);

// node_modules/@ideaspaces/protocol/dist/trailers.js
var CHANGE_ID_PATTERN = /^chg_[a-z0-9]+(-[a-z0-9]+)*$/;
var CANONICAL_KEYS = {
  op: "Op",
  conversation: "Conversation",
  turn: "Turn",
  coAuthoredBy: "Co-authored-by",
  changeId: "Change-Id"
};
var FIELD_BY_KEY = {
  op: "op",
  conversation: "conversation",
  turn: "turn",
  "co-authored-by": "coAuthoredBy",
  "change-id": "changeId"
};
var TRAILER_LINE = /^([A-Za-z][A-Za-z0-9-]*):[ \t]*(.*)$/;
var SUFFIX_LENGTH = 4;
var BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";
function isValidChangeId(id) {
  return CHANGE_ID_PATTERN.test(id);
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function formatChangeId(slug, suffix) {
  const normSuffix = suffix.toLowerCase();
  if (!/^[a-z0-9]+$/.test(normSuffix)) {
    throw new Error(`invalid Change-Id suffix: ${JSON.stringify(suffix)}`);
  }
  const normSlug = slugify(slug);
  const id = normSlug ? `chg_${normSlug}-${normSuffix}` : `chg_${normSuffix}`;
  if (!isValidChangeId(id)) {
    throw new Error(`could not format a valid Change-Id from ${JSON.stringify({ slug, suffix })}`);
  }
  return id;
}
function mintChangeId(text, rng = randomSuffix) {
  return formatChangeId(text, rng());
}
function randomSuffix() {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes)
    out += BASE36[b % 36];
  return out;
}
function parseTrailers(message) {
  const block = findTrailerBlock(message.split("\n"));
  const result = {};
  if (!block)
    return result;
  for (const line of block.lines) {
    const m = TRAILER_LINE.exec(line);
    if (!m)
      continue;
    const field = FIELD_BY_KEY[m[1].toLowerCase()];
    if (!field)
      continue;
    const value = m[2].trim();
    if (field === "coAuthoredBy") {
      (result.coAuthoredBy ??= []).push(value);
    } else if (field === "turn") {
      const n = Number.parseInt(value, 10);
      if (Number.isInteger(n))
        result.turn = n;
    } else if (field === "op") {
      result.op = value;
    } else if (field === "conversation") {
      result.conversation = value;
    } else if (field === "changeId") {
      result.changeId = value;
    }
  }
  return result;
}
function appendTrailers(message, add) {
  if (add.changeId !== void 0)
    assertChangeId(add.changeId);
  const lines = message.split("\n");
  const block = findTrailerBlock(lines);
  const existing = block ? parseTrailers(message) : {};
  const additions = diffTrailers(existing, add);
  if (additions.length === 0)
    return message;
  if (block) {
    const before = lines.slice(0, block.end + 1);
    const after = lines.slice(block.end + 1);
    return [...before, ...additions, ...after].join("\n");
  }
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "")
    end--;
  const body = lines.slice(0, end + 1);
  const sep2 = body.length > 0 ? [""] : [];
  return [...body, ...sep2, ...additions].join("\n");
}
function findTrailerBlock(rawLines) {
  let end = rawLines.length - 1;
  while (end >= 0 && rawLines[end].trim() === "")
    end--;
  if (end < 0)
    return null;
  let above = end;
  while (above >= 0 && TRAILER_LINE.test(rawLines[above]))
    above--;
  const start = above + 1;
  if (start > end)
    return null;
  if (above >= 0 && rawLines[above].trim() !== "")
    return null;
  return { start, end, lines: rawLines.slice(start, end + 1) };
}
function diffTrailers(existing, add) {
  const out = [];
  if (add.op !== void 0)
    pushSingle(out, CANONICAL_KEYS.op, existing.op, add.op);
  if (add.conversation !== void 0) {
    pushSingle(out, CANONICAL_KEYS.conversation, existing.conversation, add.conversation);
  }
  if (add.turn !== void 0) {
    pushSingle(out, CANONICAL_KEYS.turn, existing.turn === void 0 ? void 0 : String(existing.turn), String(add.turn));
  }
  for (const ca of add.coAuthoredBy ?? []) {
    if (!(existing.coAuthoredBy ?? []).includes(ca)) {
      out.push(`${CANONICAL_KEYS.coAuthoredBy}: ${ca}`);
    }
  }
  if (add.changeId !== void 0) {
    pushSingle(out, CANONICAL_KEYS.changeId, existing.changeId, add.changeId);
  }
  return out;
}
function pushSingle(out, key, existingVal, addVal) {
  if (existingVal !== void 0) {
    if (existingVal !== addVal) {
      throw new Error(`trailer conflict on ${key}: existing ${JSON.stringify(existingVal)} != ${JSON.stringify(addVal)}`);
    }
    return;
  }
  out.push(`${key}: ${addVal}`);
}
function assertChangeId(id) {
  if (!isValidChangeId(id)) {
    throw new Error(`invalid Change-Id: ${JSON.stringify(id)} (must match ${CHANGE_ID_PATTERN})`);
  }
}

// node_modules/@ideaspaces/sdk/dist/keeper-events.js
function emptyWorkspaceSurface() {
  return { created: [], modified: [], deleted: [], read: [], mentioned: [] };
}
function zeroUsage(modelTier) {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    model_tier: modelTier,
    total_tokens: 0,
    cost_usd: 0
  };
}

// node_modules/@ideaspaces/sdk/dist/agent-to-keeper.js
var PREVIEW_LIMIT = 500;
function defaultToolResultPreview(result) {
  let text;
  const content = result?.content;
  if (Array.isArray(content)) {
    text = content.map((c) => c && typeof c === "object" && "text" in c ? String(c.text) : "").filter(Boolean).join("\n");
    if (!text)
      text = JSON.stringify(result);
  } else if (typeof result === "string") {
    text = result;
  } else {
    text = JSON.stringify(result) ?? "";
  }
  return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}\u2026` : text;
}
var KeeperTranslator = class {
  cfg;
  responseText = "";
  iterations = 0;
  started = false;
  ended = false;
  toolCalls = [];
  invocations = [];
  toolStart = /* @__PURE__ */ new Map();
  constructor(config) {
    this.cfg = {
      position: "",
      now: () => Date.now(),
      harvestWorkspace: () => emptyWorkspaceSurface(),
      finalUsage: () => zeroUsage(config.modelTier),
      toolResultPreview: defaultToolResultPreview,
      ...config
    };
  }
  /** Translate one pi event into zero-or-more Keeper events. */
  translate(ev) {
    switch (ev.type) {
      case "agent_start": {
        if (this.started)
          return [];
        this.started = true;
        return [
          { type: "message_start", conversation_id: this.cfg.conversationId, model_tier: this.cfg.modelTier }
        ];
      }
      case "turn_start":
        this.iterations += 1;
        return [];
      case "message_update": {
        const a = ev.assistantMessageEvent;
        if (a.type === "thinking_delta" && a.delta)
          return [{ type: "thinking_delta", delta: a.delta }];
        if (a.type === "text_delta" && a.delta) {
          this.responseText += a.delta;
          return [{ type: "text_delta", delta: a.delta }];
        }
        return [];
      }
      case "tool_execution_start":
        this.toolStart.set(ev.toolCallId, { args: ev.args, at: this.cfg.now() });
        return [{ type: "tool_start", tool_name: ev.toolName, tool_call_id: ev.toolCallId, tool_args: ev.args }];
      case "tool_execution_end": {
        const s = this.toolStart.get(ev.toolCallId);
        const args2 = s?.args ?? {};
        const duration_ms = s ? Math.max(0, this.cfg.now() - s.at) : 0;
        this.toolStart.delete(ev.toolCallId);
        this.toolCalls.push({ name: ev.toolName, args: args2, duration_ms, is_error: ev.isError });
        this.invocations.push({ name: ev.toolName, args: args2, result: ev.result, isError: ev.isError });
        return [
          {
            type: "tool_result",
            tool_call_id: ev.toolCallId,
            tool_name: ev.toolName,
            result_preview: this.cfg.toolResultPreview(ev.result),
            is_error: ev.isError,
            duration_ms
          }
        ];
      }
      case "agent_end": {
        if (this.ended)
          return [];
        this.ended = true;
        const usage = this.cfg.finalUsage();
        const result = {
          response: this.responseText,
          usage,
          tool_calls: this.toolCalls,
          iterations: this.iterations,
          position: this.cfg.position,
          workspace: this.cfg.harvestWorkspace(this.invocations)
        };
        return [
          { type: "message_delta", usage },
          { type: "turn_complete", result }
        ];
      }
      default:
        return [];
    }
  }
  /** Terminal: the run was aborted. The caller detects this from the RPC layer. */
  cancelled(reason) {
    this.ended = true;
    return { type: "cancelled", reason };
  }
  /** Terminal: the run errored. The caller detects this from the RPC layer. */
  error(errorType, message) {
    this.ended = true;
    return { type: "error", error_type: errorType, message };
  }
  /** Whether a terminal event (turn_complete/cancelled/error) has been emitted. */
  get isEnded() {
    return this.ended;
  }
};

// dist/frontmatter-report.js
async function scanMarkdownFrontmatterSyntaxFiles(files) {
  const statuses = await Promise.all(files.map(async (path) => {
    const content = await readFile(path, "utf-8");
    return { path, ...inspectFrontmatterSyntax(content) };
  }));
  return {
    files: statuses,
    malformed: statuses.filter((s) => s.status === "malformed")
  };
}
function hasFrontmatterSyntaxProblems(scan) {
  return scan.malformed.length > 0;
}
function renderFrontmatterSyntaxProblems(scan, opts = {}) {
  if (!hasFrontmatterSyntaxProblems(scan))
    return "";
  const cwd = opts.cwd ?? process.cwd();
  const lines = [];
  if (opts.header?.length)
    lines.push(...opts.header);
  lines.push(`Malformed frontmatter (${scan.malformed.length}):`);
  for (const item of scan.malformed) {
    const loc = item.line ? `:${item.line}${item.column ? `:${item.column}` : ""}` : "";
    lines.push(`  ${relative4(cwd, item.path) || item.path}${loc}`);
    if (item.message)
      lines.push(`    ${item.message}`);
  }
  if (opts.footer?.length) {
    if (lines.length && lines.at(-1) !== "")
      lines.push("");
    lines.push(...opts.footer);
  }
  return lines.join("\n");
}

// dist/commands/publish.js
function runGit3(cwd, args2) {
  const r = spawnSync3("git", ["-C", cwd, ...args2], { encoding: "utf-8" });
  if (r.error) {
    return { ok: false, stderr: `git not available: ${r.error.message}`, stdout: "" };
  }
  return {
    ok: r.status === 0,
    stderr: (r.stderr || "").trim(),
    stdout: (r.stdout || "").trim()
  };
}
function defaultGitUrl(apiUrl, namespace, slug) {
  return `${deriveGitBase(apiUrl)}/${namespace}/${slug}.git`;
}
function spaceWebUrl(apiUrl, namespace, slug) {
  return `${deriveWebBase(apiUrl)}/${namespace}/${slug}`;
}
var SIZE_CAP_BYTES = 2e5;
var SIZE_CAP_MARKERS = ["size cap", "too large", "exceeds"];
function preflightSize(cwd) {
  const r = spawnSync3("git", ["-C", cwd, "ls-files", "-z"], { encoding: "utf-8" });
  if (r.error)
    throw new Error(`git not available: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || "git ls-files failed while checking blob sizes");
  }
  const offenders = [];
  for (const rel of r.stdout.split("\0").filter(Boolean)) {
    const abs = join9(cwd, rel);
    let bytes;
    try {
      bytes = statSync(abs).size;
    } catch {
      continue;
    }
    if (bytes > SIZE_CAP_BYTES)
      offenders.push({ path: rel, bytes });
  }
  return offenders;
}
function renderSizeProblems(offenders) {
  const noun = offenders.length === 1 ? "file" : "files";
  return [
    `Cannot publish yet: ${offenders.length} tracked ${noun} exceed the ${SIZE_CAP_BYTES.toLocaleString("en-US")}-byte server limit.`,
    "",
    ...offenders.map((o) => `  ${o.path} (${o.bytes.toLocaleString("en-US")} bytes)`),
    "",
    "Fix: add the offending paths to `.gitignore` (especially vault config",
    "like `.obsidian/`), untrack with `git rm --cached -r <path>`, commit,",
    "and retry publish. Or shrink the file, store it externally, and link",
    "it via frontmatter (`attached_to:`)."
  ].join("\n");
}
var SESSION_EXPIRED_MSG = "Your IdeaSpaces session has expired. Run `ideaspaces login` to refresh, then retry publish.";
function slugify2(input) {
  let s = input.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (s.length === 0)
    return "space";
  return s.slice(0, 64).replace(/-+$/, "");
}
async function checkMarkdownFrontmatterSyntax(cwd) {
  const files = trackedMarkdownFiles(cwd);
  if (!files.length)
    return null;
  const syntaxScan = await scanMarkdownFrontmatterSyntaxFiles(files);
  if (!hasFrontmatterSyntaxProblems(syntaxScan))
    return null;
  return renderFrontmatterSyntaxProblems(syntaxScan, {
    cwd,
    header: [
      "Cannot publish yet: markdown frontmatter is invalid.",
      "Fix YAML syntax before publishing so the server can index these files.",
      ""
    ],
    footer: ["Fix YAML first, commit the repair, and re-run `ideaspaces publish`."]
  });
}
function trackedMarkdownFiles(cwd) {
  const r = spawnSync3("git", ["-C", cwd, "ls-files", "-z", "--", "*.md"], { encoding: "utf-8" });
  if (r.error)
    throw new Error(`git not available: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || "git ls-files failed while checking markdown identities");
  }
  return r.stdout.split("\0").filter(Boolean).map((path) => join9(cwd, path));
}
var publishCommand = {
  name: "publish",
  description: "Publish this folder as a remote ideaspace",
  usage: "ideaspaces publish [--slug <slug>] [--name <name>] [--hostname <host>] [--force]",
  examples: [
    "ideaspaces publish                     # publish current directory",
    "ideaspaces publish --slug my-notes     # explicit slug",
    "ideaspaces publish --hostname acme.com # publish into an org space (must be a member)",
    "ideaspaces publish --force             # force a fresh remote even if this dir already mapped"
  ],
  async run(_args, rawFlags, global2) {
    const output = createOutput(global2);
    const flags2 = rawFlags;
    const cwd = process.cwd();
    if (!existsSync5(join9(cwd, ".git"))) {
      output.error("Not a git repo. Run `ideaspaces create` first, or `git init` here.");
      return 1;
    }
    const branchResult = runGit3(cwd, ["symbolic-ref", "--short", "HEAD"]);
    if (!branchResult.ok) {
      output.error("Couldn't determine the current branch \u2014 is HEAD detached?");
      return 1;
    }
    const branch = branchResult.stdout;
    if (branch !== "main") {
      output.error(`Local branch is \`${branch}\`; IdeaSpaces uses \`main\` as the default. Rename with \`git branch -m main\` and retry, or use \`/is-publish\` from Claude Code which offers to rename for you.`);
      return 1;
    }
    let sizeOffenders;
    try {
      sizeOffenders = preflightSize(cwd);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    if (sizeOffenders.length) {
      output.error(renderSizeProblems(sizeOffenders));
      return 1;
    }
    let frontmatterProblem;
    try {
      frontmatterProblem = await checkMarkdownFrontmatterSyntax(cwd);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    if (frontmatterProblem) {
      output.error(frontmatterProblem);
      return 1;
    }
    const stored = loadStoredCredentials();
    if (!stored) {
      output.error("Not logged in. Run `ideaspaces login` first.");
      return 1;
    }
    const config = { apiUrl: stored.api_url, apiKey: stored.api_key };
    let me;
    try {
      me = await fetchAuthMe(config);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        output.error(SESSION_EXPIRED_MSG);
        return 1;
      }
      output.error(`Couldn't reach the IdeaSpaces server: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    if (!me.username) {
      output.error("Account has no username yet. Complete onboarding before publishing.");
      return 1;
    }
    const existing = findSpaceFor(cwd);
    let repo;
    let namespace;
    if (existing && !flags2.force) {
      const stillVisible = me.repos.some((r) => r.repo_id === existing.repo_id);
      if (!stillVisible) {
        output.error(`This folder is mapped to ${existing.namespace}/${existing.slug} (repo_id=${existing.repo_id}) but that remote no longer exists or you no longer have access to it. Re-run with --force to publish as a fresh space (new repo_id), or remove this folder's entry from ~/.ideaspaces/spaces.json and retry.`);
        return 1;
      }
      const ignored = [
        flags2.name && "--name",
        flags2.slug && "--slug",
        flags2.hostname && "--hostname"
      ].filter(Boolean);
      if (ignored.length > 0) {
        output.error(`${ignored.join(", ")} only apply on first publish. This folder is already mapped to ${existing.namespace}/${existing.slug}; re-publish reuses that record. Use --force to provision a new remote.`);
        return 1;
      }
      output.log(`This folder is already published as ${existing.namespace}/${existing.slug} (repo_id=${existing.repo_id}). Re-pushing to the same remote. Use --force to provision a new one \u2014 the old server repo isn't deleted, just unlinked from this folder.`);
      repo = { repo_id: existing.repo_id, slug: existing.slug, name: existing.slug };
      namespace = existing.namespace;
    } else {
      const folderName = basename2(cwd);
      const name = flags2.name?.toString() || folderName;
      const slugInput = flags2.slug?.toString() || folderName;
      const slug = slugify2(slugInput);
      if (slug !== slugInput) {
        output.log(`Using slug: ${slug} (normalized from "${slugInput}")`);
      }
      const hostname = flags2.hostname?.toString() ?? null;
      namespace = hostname ?? me.username;
      try {
        repo = await createRepo(config, { name, slug, hostname });
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          output.error(SESSION_EXPIRED_MSG);
          return 1;
        }
        output.error(`Couldn't create remote space: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
      }
    }
    const identityEmail2 = identityEmail(me.username);
    const setEmail = runGit3(cwd, ["config", "--local", "user.email", identityEmail2]);
    if (!setEmail.ok) {
      output.error(`git config user.email failed: ${setEmail.stderr}`);
      return 1;
    }
    if (!existing || flags2.force) {
      const tipAuthor = runGit3(cwd, ["log", "-1", "--format=%ae"]);
      if (!tipAuthor.ok) {
        output.log("Could not read tip author; skipping author rewrite. If push fails the identity check, fix git history manually.");
      } else if (tipAuthor.stdout && tipAuthor.stdout !== identityEmail2) {
        output.log(`Rewriting tip commit author to ${identityEmail2} to satisfy the pre-receive identity check.`);
        const amend = runGit3(cwd, ["commit", "--amend", "--no-edit", "--reset-author"]);
        if (!amend.ok) {
          let hint = "";
          if (/gpg|signing|secret key/i.test(amend.stderr)) {
            hint = `
If you have commit signing on (\`commit.gpgsign=true\`), either configure a key for ${identityEmail2} or run \`git config --local commit.gpgsign false\` in this dir.`;
          } else if (/please tell me who you are/i.test(amend.stderr)) {
            hint = `
Git needs a \`user.name\` to commit. Run \`git config --local user.name "Your Name"\` and retry.`;
          }
          output.error(`git commit --amend failed: ${amend.stderr}${hint}`);
          return 1;
        }
      }
    }
    const remoteUrl = defaultGitUrl(config.apiUrl, namespace, repo.slug);
    const existingRemote = runGit3(cwd, ["remote", "get-url", "origin"]);
    if (existingRemote.ok) {
      if (existingRemote.stdout && existingRemote.stdout !== remoteUrl) {
        output.log(`Replacing existing origin: ${existingRemote.stdout} \u2192 ${remoteUrl}`);
      }
      const setUrl = runGit3(cwd, ["remote", "set-url", "origin", remoteUrl]);
      if (!setUrl.ok) {
        output.error(`git remote set-url failed: ${setUrl.stderr}`);
        return 1;
      }
    } else {
      const addRemote = runGit3(cwd, ["remote", "add", "origin", remoteUrl]);
      if (!addRemote.ok) {
        output.error(`git remote add failed: ${addRemote.stderr}`);
        return 1;
      }
    }
    output.progress(`Pushing main to ${remoteUrl} ...`);
    const push2 = runGit3(cwd, ["push", "-u", "origin", "main"]);
    if (!push2.ok) {
      const sizeRelated = SIZE_CAP_MARKERS.some((m) => push2.stderr.includes(m));
      const hint = sizeRelated ? "\nA blob exceeded the 200KB cap \u2014 shrink it or move it out of the repo." : "";
      output.error(`Push failed:
${push2.stderr}${hint}`);
      return 1;
    }
    saveSpace(cwd, {
      repo_id: repo.repo_id,
      slug: repo.slug,
      namespace
    });
    const webUrl = spaceWebUrl(config.apiUrl, namespace, repo.slug);
    output.result({
      repo_id: repo.repo_id,
      slug: repo.slug,
      namespace,
      remote_url: remoteUrl,
      web_url: webUrl,
      identity_email: identityEmail2
    }, [
      `Published ${repo.name}.`,
      `View: ${webUrl}`,
      `Git remote: ${remoteUrl}`,
      `Local git identity set to ${identityEmail2} (this dir only \u2014 your global git config is untouched).`
    ].join("\n"));
    return 0;
  }
};

// dist/commands/write.js
import { promises as fs6 } from "node:fs";
import { existsSync as existsSync6, statSync as statSync2 } from "node:fs";
import { dirname as dirname2, join as join10, relative as relative5, resolve as resolve7 } from "node:path";

// dist/argv.js
function parseBool(value, dflt = true) {
  if (value === void 0)
    return dflt;
  if (typeof value !== "string")
    return Boolean(value);
  const v = value.trim().toLowerCase();
  return !(v === "false" || v === "0" || v === "no" || v === "off");
}
function parseArgs(argv) {
  const global2 = { json: false, quiet: false, yes: false, help: false };
  const flags2 = {};
  const positional = [];
  let stopFlags = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      stopFlags = true;
      continue;
    }
    if (!stopFlags && arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key2 = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        if (key2 === "json") {
          global2.json = parseBool(value);
          continue;
        }
        if (key2 === "quiet") {
          global2.quiet = parseBool(value);
          continue;
        }
        if (key2 === "yes") {
          global2.yes = parseBool(value);
          continue;
        }
        if (key2 === "help") {
          global2.help = parseBool(value);
          continue;
        }
        if (key2 === "repo") {
          global2.repo = value;
          continue;
        }
        flags2[key2] = value;
        continue;
      }
      const key = arg.slice(2);
      if (key === "json") {
        global2.json = true;
        continue;
      }
      if (key === "quiet") {
        global2.quiet = true;
        continue;
      }
      if (key === "yes") {
        global2.yes = true;
        continue;
      }
      if (key === "help") {
        global2.help = true;
        continue;
      }
      if (key === "repo" && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        global2.repo = argv[++i];
        continue;
      }
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags2[key] = argv[++i];
      } else {
        flags2[key] = true;
      }
    } else if (!stopFlags && /^-[a-zA-Z]$/.test(arg)) {
      const key = arg.slice(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        flags2[key] = argv[++i];
      } else {
        flags2[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  const command2 = positional[0];
  const args2 = positional.slice(1);
  return { global: global2, command: command2, args: args2, flags: flags2 };
}

// dist/commands/write.js
async function readStdin() {
  if (process.stdin.isTTY)
    return "";
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
var writeCommand = {
  name: "write",
  description: "Create or update a Note (local file with Layer 1 frontmatter)",
  usage: "ideaspaces write <path> [--name NAME] [--summary TEXT] [--tags a,b] [--attached-to entity] [--content TEXT] [--if-match SHA] [--force] [--stage=false]",
  examples: [
    'echo "# My Note\\nContent here" | ideaspaces write notes/my-note.md --name "My Note"',
    'ideaspaces write notes/test.md --name "Test" --content "# Test\\nHello"',
    'ideaspaces write notes/test.md --content "# update" --if-match <sha>  # safe update',
    'ideaspaces write notes/test.md --content "# overwrite" --force',
    'ideaspaces write notes/test.md --content "..." --stage=false  # write without staging',
    "ideaspaces write notes/                # batch-stage every .md under notes/ + report health",
    "ideaspaces write notes/a.md notes/b.md # batch-stage a set",
    "ideaspaces write notes/ --stage=false  # health check only, no staging"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const targets = args2.filter(Boolean);
    if (!targets.length) {
      output.error("Usage: ideaspaces write <path> [--name NAME] [--summary TEXT]  |  write <dir>|<files...>  (batch stage)");
      return 1;
    }
    if (isBatchTarget(targets)) {
      return runBatchStage(targets, flags2, output);
    }
    const path = targets[0];
    let content = flags2.content;
    if (!content) {
      content = await readStdin();
      if (!content) {
        output.error("No content provided. Pipe content via stdin or use --content.");
        return 1;
      }
    }
    const fm = {
      name: flags2.name,
      summary: flags2.summary,
      tags: parseList(flags2.tags),
      attached_to: parseOptionalString(flags2["attached-to"])
    };
    const force = Boolean(flags2.force);
    const stage = parseBool(flags2.stage, true);
    const ifMatch = flags2["if-match"];
    const absPath = resolve7(path);
    if (ifMatch !== void 0) {
      const currentSha = blobSha(absPath);
      if (currentSha !== ifMatch && !force) {
        output.error(`if_match mismatch for ${path}.
  expected: ${ifMatch}
  current:  ${currentSha ?? "(file absent)"}
Re-read the file for the current sha and retry, or pass --force to override.`);
        return 6;
      }
    } else if (existsSync6(absPath) && !force) {
      output.error(`File exists: ${path}
Re-run with --force to overwrite, or pass --if-match <sha> for a safe update.`);
      return 5;
    }
    const body = stripFrontmatter(content);
    const finalContent = composeFrontmatter(fm) + body;
    await fs6.mkdir(dirname2(absPath), { recursive: true });
    await fs6.writeFile(absPath, finalContent, "utf-8");
    let staged = false;
    if (stage) {
      try {
        stagePaths([absPath]);
        staged = true;
      } catch (err) {
        const msg = err instanceof GitError ? err.message : String(err);
        output.log(`Written but not staged: ${msg}`);
      }
    }
    const sha = blobSha(absPath);
    output.result({ path: absPath, staged, sha }, `${staged ? "Written + staged" : "Written"}: ${absPath} (${sha ?? "unknown sha"})`);
    return 0;
  }
};
function parseList(value) {
  if (typeof value !== "string" || !value)
    return void 0;
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}
function parseOptionalString(value) {
  if (typeof value !== "string")
    return void 0;
  return value.trim() || void 0;
}
function isBatchTarget(targets) {
  if (targets.length > 1)
    return true;
  const abs = resolve7(targets[0]);
  return existsSync6(abs) && statSync2(abs).isDirectory();
}
async function runBatchStage(targets, flags2, output) {
  const stage = parseBool(flags2.stage, true);
  const { files, missing, skipped } = await collectMarkdown(targets);
  if (missing.length) {
    output.log(`Not found: ${missing.join(", ")}`);
  }
  if (skipped.length) {
    output.log(`Skipped (not .md): ${skipped.join(", ")}`);
  }
  if (!files.length) {
    output.error(`No .md files found in: ${targets.join(", ")}`);
    return 1;
  }
  const report = await Promise.all(files.map(async (path) => {
    const content = await fs6.readFile(path, "utf-8");
    return { path, issues: healthIssues(content) };
  }));
  let staged = false;
  if (stage) {
    try {
      stagePaths(files);
      staged = true;
    } catch (err) {
      const msg = err instanceof GitError ? err.message : String(err);
      output.log(`Not staged: ${msg}`);
    }
  }
  const flagged = report.filter((r) => r.issues.length);
  const header = `${staged ? "Staged" : "Checked"} ${files.length} note${files.length === 1 ? "" : "s"}` + (flagged.length ? `; ${flagged.length} with issues:` : "; all healthy.");
  const lines = [
    header,
    ...flagged.map((r) => `  ${relative5(process.cwd(), r.path)} \u2014 ${r.issues.join(", ")}`)
  ];
  output.result({ staged, count: files.length, files: report, missing, skipped }, lines.join("\n"));
  return 0;
}
async function collectMarkdown(targets) {
  const files = /* @__PURE__ */ new Set();
  const missing = [];
  const skipped = [];
  for (const t of targets) {
    const abs = resolve7(t);
    if (!existsSync6(abs)) {
      missing.push(t);
    } else if (statSync2(abs).isDirectory()) {
      await walkMarkdown(abs, files);
    } else if (abs.endsWith(".md")) {
      files.add(abs);
    } else {
      skipped.push(t);
    }
  }
  return { files: [...files].sort(), missing, skipped };
}
async function walkMarkdown(dir, out) {
  const entries = await fs6.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules")
      continue;
    const p = join10(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdown(p, out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.add(p);
    }
  }
}
function healthIssues(content) {
  const issues = [];
  const syntax = inspectFrontmatterSyntax(content);
  if (syntax.status === "none") {
    issues.push("no frontmatter");
  } else if (syntax.status === "malformed") {
    issues.push(`malformed frontmatter (${syntax.message})`);
  }
  if (!extractSummary(content))
    issues.push("no summary");
  if (!/(?<!!)\[[^\]]*\]\([^)\s]+\)/.test(stripFrontmatter(content)))
    issues.push("no outbound links");
  return issues;
}

// dist/commands/commit.js
import { resolve as resolve8 } from "node:path";
var OP_SET = {
  create: true,
  update: true,
  move: true,
  delete: true,
  restructure: true,
  capture: true
};
var OPS = Object.keys(OP_SET);
var PRINCIPAL_PREFIX = /^(person|agent|node):/;
function applyTrailerFlags(message, flags2) {
  const trailers = {};
  const op = typeof flags2.op === "string" ? flags2.op.trim() : "";
  if (op) {
    if (!(op in OP_SET)) {
      throw new Error(`Invalid --op "${op}". Expected one of: ${OPS.join(", ")}.`);
    }
    trailers.op = op;
  }
  const changeId = typeof flags2["change-id"] === "string" ? flags2["change-id"].trim() : "";
  if (changeId) {
    if (!isValidChangeId(changeId)) {
      throw new Error(`Invalid --change-id "${changeId}". Expected a chg_\u2026 id (mint with: ideaspaces change new).`);
    }
    trailers.changeId = changeId;
  }
  const conversation = typeof flags2.conversation === "string" ? flags2.conversation.trim() : "";
  if (conversation)
    trailers.conversation = conversation;
  const coAuthor = typeof flags2["co-author"] === "string" ? flags2["co-author"] : "";
  const coAuthors = coAuthor.split(",").map((s) => s.trim()).filter(Boolean);
  for (const a of coAuthors) {
    if (!PRINCIPAL_PREFIX.test(a)) {
      throw new Error(`Invalid --co-author "${a}". Expected a person:/agent:/node: principal (e.g. agent:me-claude).`);
    }
  }
  if (coAuthors.length)
    trailers.coAuthoredBy = coAuthors;
  const anySet = trailers.op || trailers.changeId || trailers.conversation || trailers.coAuthoredBy;
  return anySet ? appendTrailers(message, trailers) : message;
}
var commitCommand = {
  name: "commit",
  description: "Save staged captures \u2014 commits only the paths you name",
  usage: 'ideaspaces commit -m "<message>" <path>... | --all [--op <op>] [--change-id <chg_\u2026>] [--conversation <id>] [--co-author <a[,b]>]',
  examples: [
    'ideaspaces commit -m "Capture auth decision" notes/auth.md',
    'ideaspaces commit -m "Save notes" --all   # all staged markdown / _agent/ paths',
    'ideaspaces commit -m "Capture" notes/auth.md --op capture --change-id chg_auth-1a2b --conversation sess_9 --co-author "agent:me-claude"'
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const message = String(flags2.m ?? flags2.message ?? "").trim();
    if (!message) {
      output.error('A commit message is required: ideaspaces commit -m "<message>" <path>...');
      return 1;
    }
    let root;
    try {
      root = repoRoot();
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    if (args2.length > 0 && flags2.all) {
      output.error("Use exactly one of: explicit <path>..., or --all.");
      return 1;
    }
    let paths;
    if (flags2.all) {
      const staged = stagedPaths(root);
      if (!staged.length) {
        output.error("Nothing staged to commit.");
        return 1;
      }
      paths = staged.filter(isIdeaspacePath);
      const other = staged.filter((p) => !isIdeaspacePath(p));
      if (!paths.length) {
        output.error("No staged ideaspace paths (markdown or _agent/). Staged non-knowledge files:\n" + other.map((p) => `  ${p}`).join("\n"));
        return 1;
      }
      if (other.length) {
        output.log(`Leaving ${other.length} non-ideaspace staged path(s) for you to commit: ${other.join(", ")}`);
      }
    } else {
      paths = args2.map((p) => resolve8(p));
    }
    if (!paths.length) {
      output.error('Refusing to commit with no paths. Name the paths to save:\n  ideaspaces commit -m "<message>" <path>...\nor use --all.');
      return 1;
    }
    let finalMessage;
    try {
      finalMessage = applyTrailerFlags(message, flags2);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    await ensureLocalIdentity(root);
    let sha;
    try {
      sha = commitPaths(finalMessage, paths, root);
    } catch (err) {
      if (err instanceof GitError) {
        output.error(`Commit failed: ${err.message}`);
        return 1;
      }
      throw err;
    }
    output.result({ commit_sha: sha, committed_paths: paths }, `Committed ${paths.length} path(s): ${sha}`);
    return 0;
  }
};

// dist/commands/change.js
var USAGE = "ideaspaces change new [<handle>] [--handle <text>]";
function resolveHandle(flags2, args2) {
  const fromFlag = typeof flags2.handle === "string" ? flags2.handle : "";
  return (fromFlag || args2[0] || "").trim();
}
function cmdNew(args2, flags2, output) {
  const changeId = mintChangeId(resolveHandle(flags2, args2));
  if (!isValidChangeId(changeId)) {
    output.error(`Minted an invalid Change-Id: ${changeId}`);
    return 1;
  }
  output.result({ change_id: changeId }, changeId);
  return 0;
}
var changeCommand = {
  name: "change",
  description: "Mint a Change-Id for a decision spanning multiple commits/repos",
  usage: USAGE,
  examples: [
    'ideaspaces change new "auth session model"',
    "ideaspaces change new --handle surface-collapse --json"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const sub = args2[0];
    if (sub === "new")
      return cmdNew(args2.slice(1), flags2, output);
    output.error(`Usage: ${USAGE}`);
    return 1;
  }
};

// dist/commands/navigate.js
import { relative as relative6, resolve as resolve9 } from "node:path";
import { statSync as statSync3, existsSync as existsSync8 } from "node:fs";
import { spawnSync as spawnSync4 } from "node:child_process";

// dist/catalog.js
import { existsSync as existsSync7 } from "node:fs";
import { readdir, readFile as readFile2 } from "node:fs/promises";
import { basename as basename3, join as join11, resolve as resolvePath } from "node:path";
var AUTOCOMPLETE_EXCLUDES = [".git", "node_modules", "backups", ".pi", ".claude"];
var MAX_CATALOG_REPOS = 20;
function firstContentLine(content) {
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("---"))
      return trimmed;
  }
  return null;
}
async function readRootSummary(root) {
  const candidates = [join11(root, "_agent", "now.md"), join11(root, "README.md")];
  for (const candidate of candidates) {
    try {
      const content = await readFile2(candidate, "utf-8");
      const summary = extractSummary(content) ?? firstContentLine(content);
      if (summary)
        return summary.replace(/\s+/g, " ").trim();
    } catch {
    }
  }
  return null;
}
async function countTopLevelDirs(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && !AUTOCOMPLETE_EXCLUDES.includes(entry.name)).length;
  } catch {
    return null;
  }
}
async function readRootHandle(root) {
  const [summary, dirCount] = await Promise.all([readRootSummary(root), countTopLevelDirs(root)]);
  return { summary, dirCount };
}
function formatRootHandleLine(label, display, handle) {
  const parts = [`  ${label}: ${display}`];
  if (handle.summary)
    parts.push(` \u2014 ${handle.summary}`);
  if (handle.dirCount != null)
    parts.push(` (${handle.dirCount} dirs)`);
  return parts.join("");
}
async function formatWorkingSetSection(homeRoot, mounts) {
  const lines = ["Working set:"];
  const homeHandle = await readRootHandle(homeRoot);
  lines.push(formatRootHandleLine("home", basename3(homeRoot) || homeRoot, homeHandle));
  const mountHandles = await Promise.all(mounts.map((mount) => readRootHandle(mount)));
  mounts.forEach((mount, index) => {
    lines.push(formatRootHandleLine("mount", mount, mountHandles[index]));
  });
  return lines.join("\n");
}
async function readRepoState(repoRoot2) {
  let state;
  try {
    state = await gitState(repoRoot2);
  } catch {
    return "unknown";
  }
  let base;
  if (state.ahead == null || state.behind == null) {
    base = "local-only";
  } else if (state.ahead > 0 && state.behind > 0) {
    base = `diverged +${state.ahead}/-${state.behind}`;
  } else if (state.ahead > 0) {
    base = `ahead ${state.ahead}`;
  } else if (state.behind > 0) {
    base = `behind ${state.behind}`;
  } else {
    base = "synced";
  }
  return state.dirty ? `${base} \xB7 dirty` : base;
}
async function formatCatalogSection(workspaceFolder, opts) {
  let repos;
  try {
    const entries = await readdir(workspaceFolder, { withFileTypes: true });
    repos = entries.filter((entry) => entry.isDirectory() && !AUTOCOMPLETE_EXCLUDES.includes(entry.name)).map((entry) => join11(workspaceFolder, entry.name)).filter((dir) => existsSync7(join11(dir, ".git")));
  } catch {
    repos = [];
  }
  repos.sort((a, b) => basename3(a).localeCompare(basename3(b)));
  const pov = opts.povRepoRoot ? resolvePath(opts.povRepoRoot) : null;
  const mountSet = new Set(opts.mounts.map((mount) => resolvePath(mount)));
  const isPriority = (repo) => {
    const abs = resolvePath(repo);
    return abs === pov || mountSet.has(abs);
  };
  const priority = repos.filter(isPriority);
  const ordered = [...priority, ...repos.filter((repo) => !isPriority(repo))];
  const shown = ordered.slice(0, Math.max(MAX_CATALOG_REPOS, priority.length));
  const overflow = repos.length - shown.length;
  const rows = await Promise.all(shown.map(async (repo) => {
    const [summary, state] = await Promise.all([readRootSummary(repo), readRepoState(repo)]);
    const tags = [state];
    if (pov && resolvePath(repo) === pov)
      tags.push("POV");
    if (mountSet.has(resolvePath(repo)))
      tags.push("mounted");
    const parts = [`  ${basename3(repo)}`];
    if (summary)
      parts.push(` \u2014 ${summary}`);
    parts.push(` (${tags.join(" \xB7 ")})`);
    return parts.join("");
  }));
  const blocks = [];
  if (rows.length) {
    const lines = ["Repos in scope (local):", ...rows];
    if (overflow > 0)
      lines.push(`  \u2026and ${overflow} more`);
    blocks.push(lines.join("\n"));
  }
  const pullable = opts.pullable ?? [];
  if (pullable.length) {
    blocks.push([
      "Pullable (remote \u2014 not yet local):",
      ...pullable.map((p) => `  ${p.slug} (${p.namespace})`),
      "  \u2192 to work on one, clone it into this folder with `ideaspaces clone` (via bash)."
    ].join("\n"));
  }
  return blocks.length ? blocks.join("\n\n") : null;
}

// dist/commands/navigate.js
var MAX_DRIFT = 10;
var SEEN_REF = "refs/ideaspaces/seen";
function gitRef(cwd, args2) {
  const r = spawnSync4("git", ["-C", cwd, ...args2], { encoding: "utf-8" });
  return r.status === 0 ? r.stdout.trim() || null : null;
}
function formatPositionSection(pos, base, repoRoot2, pathContext) {
  const spaceRoot = spaceRootLevel(pathContext);
  const branch = currentBranchLevel(pathContext);
  const lines = ["Position:"];
  if (repoRoot2)
    lines.push(`  repo: ${repoRoot2}`);
  lines.push(`  cwd: ${relative6(base, pos) || "."}`);
  if (spaceRoot)
    lines.push(`  space root: ${spaceRoot.path || "."}`);
  if (branch)
    lines.push(`  active _agent: ${branch.path || "."}`);
  return lines.join("\n");
}
function parsePullable(raw) {
  if (typeof raw !== "string")
    return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(":");
    return i > 0 ? { slug: p.slice(0, i), namespace: p.slice(i + 1) } : null;
  }).filter((x) => x !== null);
}
var BARE_FOLDER_HINT = "You're at a workspace folder (no `_agent/` contract here). Navigate into a repo below (`ideaspaces navigate <repo>`), or pull one that's behind.";
var EMPTY_FOLDER_HINT = "You're at a workspace folder with no repos yet. Clone one to get started (`ideaspaces clone`).";
function planCatalog(flags2, povRepoRoot) {
  const workspace = typeof flags2.workspace === "string" ? resolve9(flags2.workspace) : null;
  if (!workspace)
    return { kind: "none" };
  if (!existsSync8(workspace) || !statSync3(workspace).isDirectory()) {
    return { kind: "warn", text: `\u26A0 --workspace is not a readable directory: ${workspace} (catalog skipped)` };
  }
  const mounts = typeof flags2.mount === "string" ? flags2.mount.split(",").map((m) => m.trim()).filter(Boolean) : [];
  const catalog = formatCatalogSection(workspace, { povRepoRoot, mounts, pullable: parsePullable(flags2.pullable) });
  return { kind: "ok", mounts, catalog };
}
var navigateCommand = {
  name: "navigate",
  description: "Re-derive orientation (fractal contract, tree, drift) at a position",
  usage: "ideaspaces navigate [<path>] [--mark-seen] [--workspace <dir>] [--mount <a,b,c>] [--pullable <s:ns,\u2026>] [--no-git]",
  examples: [
    "ideaspaces navigate --json            # orient at the current directory",
    "ideaspaces navigate docs --json       # orient at a branch",
    "ideaspaces navigate --workspace . --mount ../other-repo --json  # + local repo catalog + working set",
    "ideaspaces navigate --workspace . --pullable team:acme.com,notes:alice --no-git --json  # + remote tier; caller renders its own state"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const raw = (args2[0] ?? ".").trim();
    const target = resolve9(raw === "" ? "." : raw);
    if (!existsSync8(target)) {
      output.error(`No such path: ${target}`);
      return 1;
    }
    if (!statSync3(target).isDirectory()) {
      output.error(`Not a directory: ${target}`);
      return 1;
    }
    let repoRoot2 = null;
    let gs;
    if (isInsideWorkTree(target)) {
      gs = await gitState(target);
      repoRoot2 = gs.repoRoot;
    }
    const composed = await composeContractAlongPath(target);
    const position = relative6(repoRoot2 ?? composed.spaceRoot ?? target, target) || ".";
    const cat = planCatalog(flags2, repoRoot2);
    if (!composed.spaceRoot) {
      const bare = [];
      if (cat.kind === "warn")
        bare.push(cat.text);
      else if (cat.kind === "ok") {
        const catalog2 = await cat.catalog;
        if (catalog2)
          bare.push(catalog2);
        if (!repoRoot2)
          bare.push(catalog2 ? BARE_FOLDER_HINT : EMPTY_FOLDER_HINT);
      }
      output.result({ text: bare.length ? bare.join("\n\n") : null, position, root: null, repoRoot: repoRoot2 }, bare.length ? bare.join("\n\n") : "No _agent/ contract resolves at this position.");
      return 0;
    }
    const base = repoRoot2 ?? composed.spaceRoot;
    const lastSha = repoRoot2 ? gitRef(repoRoot2, ["rev-parse", "--verify", "--quiet", SEEN_REF]) ?? void 0 : void 0;
    const [block, pathContext, catalog, workingSet] = await Promise.all([
      assembleAwareness({ root: target, contract: composed.contract, lastSha }),
      base ? walkPathContext(base, target) : Promise.resolve(null),
      cat.kind === "ok" ? cat.catalog : Promise.resolve(null),
      cat.kind === "ok" ? formatWorkingSetSection(composed.spaceRoot, cat.mounts) : Promise.resolve(null)
    ]);
    const sections = [];
    if (pathContext && base)
      sections.push(formatPositionSection(target, base, repoRoot2, pathContext));
    if (block.trim())
      sections.push(block);
    if (cat.kind === "warn")
      sections.push(cat.text);
    else if (cat.kind === "ok") {
      if (workingSet)
        sections.push(workingSet);
      if (catalog)
        sections.push(catalog);
    }
    if (repoRoot2 && gs) {
      const bits = [];
      if (gs.branch)
        bits.push(`branch ${gs.branch}`);
      if (gs.ahead != null && gs.behind != null && (gs.ahead || gs.behind))
        bits.push(`\u2191${gs.ahead} \u2193${gs.behind}`);
      if (gs.dirty)
        bits.push("dirty");
      if (gs.untrackedInTrackedDirs.length)
        bits.push(`${gs.untrackedInTrackedDirs.length} untracked`);
      if (bits.length && !flags2["no-git"])
        sections.push(`Git: ${bits.join(", ")}`);
      const signals = await staleDocSignals(repoRoot2, await collectDocDependencies(repoRoot2, repoRoot2));
      if (signals.length) {
        const lines = ["\u26A0 Possible stale docs \u2014 verify before quoting their status:"];
        for (const s of signals.slice(0, MAX_DRIFT)) {
          lines.push(s.kind === "stale" ? `  ${s.doc} \u2014 \`${s.newestCode}\` was committed after the doc` : `  ${s.doc} \u2014 references missing path(s): ${s.missing.join(", ")}`);
        }
        if (signals.length > MAX_DRIFT)
          lines.push(`  \u2026 and ${signals.length - MAX_DRIFT} more`);
        sections.push(lines.join("\n"));
      }
      if (flags2["mark-seen"]) {
        try {
          gitRef(repoRoot2, ["update-ref", SEEN_REF, headSha(repoRoot2)]);
        } catch {
        }
      }
    }
    const direction = [];
    if (!composed.contract.purpose) {
      direction.push("\u26A0 `_agent/purpose.md` not yet captured. The contract names it; suggest capturing at a natural moment.");
    }
    if (!composed.contract.now) {
      direction.push("\u26A0 `_agent/now.md` not yet captured. Suggest capturing what's currently active.");
    }
    if (direction.length)
      sections.push(direction.join("\n"));
    const text = sections.join("\n\n");
    output.result({ text: text || null, position, root: composed.spaceRoot, repoRoot: repoRoot2 }, text || "(no orientation)");
    return 0;
  }
};

// dist/commands/status.js
import { resolve as resolve10 } from "node:path";
var statusCommand = {
  name: "status",
  description: "Show git position and plugin-tracked captures awaiting commit",
  usage: "ideaspaces status [--path FILE] [--fetch] [--json]",
  examples: [
    "ideaspaces status",
    "ideaspaces status --json",
    "ideaspaces status --fetch  # fetch first, so ahead/behind reflect the remote",
    "ideaspaces status --fetch --path notes/a.md",
    "ideaspaces status --path notes/a.md  # single-file state + sha (if_match source)"
  ],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    let root;
    try {
      root = repoRoot();
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    const pathArg = typeof flags2.path === "string" ? flags2.path : void 0;
    if (pathArg) {
      const ps = pathStatus(resolve10(pathArg), root);
      output.result({
        path: pathArg,
        exists: ps.exists,
        sha: ps.sha,
        in_index: ps.inIndex,
        modified: ps.modified,
        in_tracked: ps.inTracked
      }, ps.exists ? `${pathArg}: sha ${ps.sha}${ps.inIndex ? ", staged" : ""}${ps.modified ? ", modified" : ""}${ps.inTracked ? "" : ", untracked"}` : `${pathArg}: does not exist`);
      return 0;
    }
    if (flags2.fetch) {
      try {
        fetch2(root);
      } catch (err) {
        output.error(`git fetch failed: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
      }
    }
    const gs = await gitState(root);
    const tracked = stagedIdeaspacePaths(root);
    const data = {
      repoRoot: gs.repoRoot,
      branch: gs.branch,
      ahead: gs.ahead,
      behind: gs.behind,
      dirty: gs.dirty,
      untracked_in_tracked_dirs: gs.untrackedInTrackedDirs,
      tracked_captures: tracked
    };
    const lines = [];
    lines.push(`branch:  ${gs.branch ?? "(detached)"}`);
    if (gs.ahead != null || gs.behind != null) {
      lines.push(`remote:  ahead ${gs.ahead ?? 0}, behind ${gs.behind ?? 0}`);
    } else {
      lines.push("remote:  no upstream");
    }
    lines.push(`tree:    ${gs.dirty ? "dirty" : "clean"}`);
    if (tracked.length) {
      lines.push("", `captures awaiting commit (${tracked.length}):`);
      for (const p of tracked)
        lines.push(`  ${p}`);
      lines.push("", 'Save them: ideaspaces commit -m "<message>" --all');
    } else {
      lines.push("", "no staged captures awaiting commit");
    }
    output.result(data, lines.join("\n"));
    return 0;
  }
};

// dist/commands/sync.js
var syncCommand = {
  name: "sync",
  description: "(removed) use `pull` then `push`",
  usage: "ideaspaces pull | ideaspaces push",
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    output.error("`ideaspaces sync` has been split into two directional commands:\n  ideaspaces pull   integrate remote changes into your local ideaspace\n  ideaspaces push   send your committed captures to the remote\nIf you're diverged: pull first, then push.");
    return 1;
  }
};

// dist/commands/push.js
var pushCommand = {
  name: "push",
  description: "Send committed captures to the remote",
  usage: "ideaspaces push [--dry-run]",
  examples: ["ideaspaces push", "ideaspaces push --dry-run"],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const dryRun = Boolean(flags2["dry-run"]);
    let root;
    try {
      root = repoRoot();
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    const staged = stagedIdeaspacePaths(root);
    if (staged.length) {
      output.error(`Refusing to push: ${staged.length} staged capture(s) not yet committed.
` + staged.map((p) => `  ${p}`).join("\n") + '\nSave them first: ideaspaces commit -m "<message>" --all');
      return 1;
    }
    if (dryRun) {
      const rs = remoteState(root);
      const plan = [];
      if (!rs.upstream)
        plan.push("no upstream configured \u2014 nothing to push");
      else {
        plan.push(`upstream: ${rs.upstream} (ahead ${rs.ahead}, behind ${rs.behind})`);
        if (rs.behind)
          plan.push(`would refuse: ${rs.behind} commit(s) behind \u2014 pull first`);
        else if (rs.ahead)
          plan.push(`would push ${rs.ahead} commit(s)`);
        else
          plan.push("up to date \u2014 nothing to push");
      }
      plan.push("(dry run \u2014 nothing fetched or pushed)");
      output.result({ dry_run: true, ...rs }, plan.join("\n"));
      return 0;
    }
    await registerGitCredentialHelper();
    try {
      fetch2(root);
      const rs = remoteState(root);
      if (!rs.upstream) {
        output.error("No upstream configured for the current branch.");
        return 1;
      }
      if (rs.behind) {
        output.error(`Refusing to push: ${rs.behind} commit(s) behind ${rs.upstream}.
Pull first, then push: ideaspaces pull`);
        return 1;
      }
      if (!rs.ahead) {
        output.result({ upstream: rs.upstream, pushed: 0 }, "Already up to date \u2014 nothing to push.");
        return 0;
      }
      push(root);
      output.result({ upstream: rs.upstream, pushed: rs.ahead }, `Pushed ${rs.ahead} commit(s) to ${rs.upstream}.`);
      return 0;
    } catch (err) {
      if (err instanceof GitError) {
        output.error(`Push failed: ${err.message}`);
        return 1;
      }
      throw err;
    }
  }
};

// dist/commands/pull.js
var pullCommand = {
  name: "pull",
  description: "Integrate remote changes into the local ideaspace",
  usage: "ideaspaces pull [--dry-run] [--rebase=false]",
  examples: ["ideaspaces pull", "ideaspaces pull --dry-run", "ideaspaces pull --rebase=false"],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const dryRun = Boolean(flags2["dry-run"]);
    const useRebase = parseBool(flags2.rebase, true);
    let root;
    try {
      root = repoRoot();
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    if (dryRun) {
      const rs = remoteState(root);
      const plan = [];
      if (!rs.upstream)
        plan.push("no upstream configured \u2014 nothing to pull");
      else {
        plan.push(`upstream: ${rs.upstream} (ahead ${rs.ahead}, behind ${rs.behind})`);
        if (rs.behind)
          plan.push(`would ${useRebase ? "rebase onto" : "merge"} upstream (requires clean tree)`);
        else
          plan.push("up to date \u2014 nothing to integrate");
      }
      plan.push("(dry run \u2014 nothing fetched or integrated)");
      output.result({ dry_run: true, ...rs }, plan.join("\n"));
      return 0;
    }
    await registerGitCredentialHelper();
    try {
      fetch2(root);
      const rs = remoteState(root);
      if (!rs.upstream) {
        output.error("No upstream configured for the current branch.");
        return 1;
      }
      if (!rs.behind) {
        output.result({ upstream: rs.upstream, integrated: 0 }, "Already up to date \u2014 nothing to pull.");
        return 0;
      }
      const staged = stagedIdeaspacePaths(root);
      if (staged.length) {
        output.error(`Refusing to pull: ${staged.length} staged capture(s) not yet committed.
` + staged.map((p) => `  ${p}`).join("\n") + '\nSave them first: ideaspaces commit -m "<message>" --all');
        return 1;
      }
      if (isDirty(root)) {
        output.error("Refusing to integrate remote changes: working tree is dirty.\nCommit your changes first, then re-run pull.");
        return 1;
      }
      try {
        if (useRebase)
          rebaseOntoUpstream(root);
        else
          mergeUpstream(root);
      } catch (err) {
        const msg = err instanceof GitError ? err.message : String(err);
        const reset = useRebase ? "git rebase --abort" : "git merge --abort";
        output.error(`Pull failed while integrating remote changes: ${msg}
The repo may be mid-${useRebase ? "rebase" : "merge"}. Run \`${reset}\` to reset, resolve the conflict, then re-run pull.`);
        return 1;
      }
      output.result({ upstream: rs.upstream, integrated: rs.behind }, `Pulled: integrated ${rs.behind} commit(s) from ${rs.upstream}.`);
      return 0;
    } catch (err) {
      if (err instanceof GitError) {
        output.error(`Pull failed: ${err.message}`);
        return 1;
      }
      throw err;
    }
  }
};

// dist/commands/skills.js
var skillsCommand = {
  name: "skills",
  description: "List the skill catalog, or print one skill's markdown",
  usage: "ideaspaces skills [<name>]",
  examples: ["ideaspaces skills", "ideaspaces skills capture", "ideaspaces skills --json"],
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const name = args2[0];
    try {
      if (name) {
        const skill = await readSkill(name);
        output.result({ name: skill.name, description: skill.description, content: skill.content }, skill.content);
      } else {
        const skills = await listSkills();
        output.result(skills, skills.map((s) => `${s.name}${s.description ? `  \u2014  ${s.description}` : ""}`).join("\n"));
      }
      return 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      output.error(name ? `${msg}
Run \`ideaspaces skills\` to list available skills.` : msg);
      return 1;
    }
  }
};

// dist/commands/credential.js
var credentialCommand = {
  name: "credential",
  description: "Git credential helper (invoked by git \u2014 usually not run directly)",
  usage: "ideaspaces credential <get|store|erase>",
  async run(args2) {
    const action = args2[0];
    if (action === "store" || action === "erase") {
      await drainStdin();
      return 0;
    }
    if (action !== "get") {
      await drainStdin();
      return 1;
    }
    return handleGet();
  }
};
async function handleGet() {
  const input = await readStdin2();
  const params = parseCredentialInput(input);
  if (!isIdeaspacesHost(params.host)) {
    return 0;
  }
  const config = loadConfig();
  if (!config) {
    return 0;
  }
  const username = params.username && params.username.length > 0 ? params.username : "token";
  const reply = [
    `username=${username}`,
    `password=${config.apiKey}`,
    "",
    ""
  ].join("\n");
  process.stdout.write(reply);
  return 0;
}
function isIdeaspacesHost(host) {
  if (!host)
    return false;
  return host === "git.ideaspaces.xyz" || host === "git.ideaspaces.localhost" || host.endsWith(".ideaspaces.xyz");
}
function parseCredentialInput(input) {
  const params = {};
  for (const line of input.split("\n")) {
    const trimmed = line.replace(/\r$/, "");
    if (!trimmed)
      continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0)
      continue;
    params[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return params;
}
async function readStdin2() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
async function drainStdin() {
  for await (const _ of process.stdin) {
  }
}

// dist/commands/whoami.js
var whoamiCommand = {
  name: "whoami",
  description: "Show login state \u2014 whether credentials are present, and the API URL",
  usage: "ideaspaces whoami [--json]",
  examples: [
    "ideaspaces whoami",
    "ideaspaces whoami --json"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.result({ logged_in: false }, "Not logged in. Run `ideaspaces login`.");
      return 0;
    }
    output.result({ logged_in: true, api_url: config.apiUrl }, `Logged in to ${config.apiUrl}.`);
    return 0;
  }
};

// dist/commands/repos.js
var reposCommand = {
  name: "repos",
  description: "List your spaces \u2014 slug, role, and member count",
  usage: "ideaspaces repos [--json]",
  examples: [
    "ideaspaces repos",
    "ideaspaces repos --json"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run `ideaspaces login`.");
      return 1;
    }
    let me;
    try {
      me = await fetchAuthMe(config);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        output.error("Session expired. Run `ideaspaces login`.");
        return 1;
      }
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    const repos = me.repos.map((r) => ({
      repo_id: r.repo_id,
      slug: r.slug,
      hostname: r.hostname,
      // Namespace for clone-URL construction: org hostname, else the username.
      namespace: r.hostname ?? me.username,
      role: r.role,
      member_count: r.member_count
    }));
    output.result({ username: me.username, repos }, repos.length ? repos.map((r) => `${r.slug} (${r.role}, ${r.member_count} member${r.member_count === 1 ? "" : "s"})`).join("\n") : "No spaces yet. Create one at your account, or `ideaspaces create`.");
    return 0;
  }
};

// dist/commands/catalog.js
function deriveCatalog(me, clones, statusByPath) {
  const syncOf = (path) => {
    const st = statusByPath.get(path);
    if (!st)
      return {};
    if ("failed" in st)
      return { statusFailed: true };
    return { sync: { branch: st.branch, ahead: st.ahead, behind: st.behind, dirty: st.dirty } };
  };
  if (!me) {
    return clones.map((c) => ({
      repo_id: c.record.repo_id,
      slug: c.record.slug,
      hostname: null,
      namespace: c.record.namespace,
      location: "available",
      clone: { path: c.path },
      ...syncOf(c.path)
    }));
  }
  const clonesByRepo = /* @__PURE__ */ new Map();
  for (const c of clones) {
    const list2 = clonesByRepo.get(c.record.repo_id) ?? [];
    list2.push(c);
    clonesByRepo.set(c.record.repo_id, list2);
  }
  const entries = [];
  const used = /* @__PURE__ */ new Set();
  for (const repo of me.repos) {
    const namespace = repo.hostname ?? me.username ?? "";
    const matching = clonesByRepo.get(repo.repo_id) ?? [];
    if (matching.length === 0) {
      entries.push({
        repo_id: repo.repo_id,
        slug: repo.slug,
        hostname: repo.hostname,
        namespace,
        role: repo.role,
        member_count: repo.member_count,
        location: "online-only"
      });
      continue;
    }
    for (const c of matching) {
      used.add(c.path);
      entries.push({
        repo_id: repo.repo_id,
        slug: repo.slug,
        hostname: repo.hostname,
        namespace,
        role: repo.role,
        member_count: repo.member_count,
        location: "available",
        clone: { path: c.path },
        ...syncOf(c.path)
      });
    }
  }
  for (const c of clones) {
    if (used.has(c.path))
      continue;
    entries.push({
      repo_id: c.record.repo_id,
      slug: c.record.slug,
      hostname: null,
      namespace: c.record.namespace,
      location: "local-only",
      clone: { path: c.path },
      ...syncOf(c.path)
    });
  }
  return entries;
}
function stateLabel(entry) {
  if (entry.statusFailed)
    return "status unknown";
  if (!entry.sync)
    return "";
  const { ahead, behind, dirty } = entry.sync;
  let base;
  if (ahead == null || behind == null)
    base = "local-only";
  else if (ahead > 0 && behind > 0)
    base = `diverged +${ahead}/-${behind}`;
  else if (ahead > 0)
    base = `ahead ${ahead}`;
  else if (behind > 0)
    base = `behind ${behind}`;
  else
    base = "synced";
  return dirty ? `${base}, dirty` : base;
}
function formatHuman(entries, notes) {
  const out = [...notes];
  if (entries.length === 0) {
    out.push("No repos \u2014 clone one (`ideaspaces clone`) or create a space.");
    return out.join("\n");
  }
  const groups = [
    ["available", "available:"],
    ["online-only", "online-only (pullable):"],
    ["local-only", "local-only:"]
  ];
  for (const [loc, header] of groups) {
    const items = entries.filter((e) => e.location === loc);
    if (!items.length)
      continue;
    if (out.length)
      out.push("");
    out.push(header);
    for (const e of items) {
      if (loc === "online-only")
        out.push(`  ${e.slug} (${e.namespace})`);
      else
        out.push(`  ${e.slug} \u2014 ${stateLabel(e)}${e.clone ? `  ${e.clone.path}` : ""}`);
    }
  }
  return out.join("\n");
}
var catalogCommand = {
  name: "catalog",
  description: "One view of your repos \u2014 local clones and remote spaces, with sync state",
  usage: "ideaspaces catalog [--fetch] [--json]",
  examples: [
    "ideaspaces catalog",
    "ideaspaces catalog --json",
    "ideaspaces catalog --fetch  # refresh remotes first, so ahead/behind reflect the server"
  ],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    let me = null;
    const notes = [];
    if (config) {
      try {
        me = await fetchAuthMe(config);
      } catch (err) {
        notes.push(err instanceof UnauthorizedError ? "Session expired \u2014 showing local clones only. Run `ideaspaces login`." : `Could not reach the server (${err instanceof Error ? err.message : String(err)}) \u2014 showing local clones only.`);
      }
    } else {
      notes.push("Not logged in \u2014 showing local clones only. `ideaspaces login` adds the remote tier.");
    }
    const clones = listClones();
    if (flags2.fetch) {
      let fetchFailed = 0;
      for (const c of clones) {
        try {
          fetch2(c.path);
        } catch {
          fetchFailed++;
        }
      }
      if (fetchFailed > 0) {
        notes.push(`${fetchFailed} of ${clones.length} clone(s) could not be fetched \u2014 their ahead/behind may be stale.`);
      }
    }
    const statusByPath = /* @__PURE__ */ new Map();
    await Promise.all(clones.map(async (c) => {
      try {
        const gs = await gitState(c.path);
        statusByPath.set(c.path, { branch: gs.branch, ahead: gs.ahead, behind: gs.behind, dirty: gs.dirty });
      } catch {
        statusByPath.set(c.path, { failed: true });
      }
    }));
    const entries = deriveCatalog(me, clones, statusByPath);
    output.result({ logged_in: me !== null, username: me?.username ?? null, notes, entries }, formatHuman(entries, notes));
    return 0;
  }
};

// dist/commands/clone.js
import { resolve as resolve11 } from "node:path";
var cloneCommand = {
  name: "clone",
  description: "Clone one of your spaces into a local folder",
  usage: "ideaspaces clone <space> [dir]",
  examples: [
    "ideaspaces clone notes                 # clone into ./notes",
    "ideaspaces clone alice/notes ./n       # explicit namespace/slug + dir"
  ],
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const target = args2[0];
    if (!target) {
      output.error("Usage: ideaspaces clone <space> [dir]");
      return 1;
    }
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run `ideaspaces login`.");
      return 1;
    }
    let me;
    try {
      me = await fetchAuthMe(config);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        output.error("Session expired. Run `ideaspaces login`.");
        return 1;
      }
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    const matches = me.repos.filter((r) => {
      const namespace2 = r.hostname ?? me.username;
      return r.repo_id === target || r.slug === target || `${namespace2}/${r.slug}` === target;
    });
    if (matches.length === 0) {
      output.error(`No space matches "${target}". Run \`ideaspaces repos\` to list yours.`);
      return 1;
    }
    if (matches.length > 1) {
      output.error(`"${target}" is ambiguous \u2014 use namespace/slug or the repo_id.`);
      return 1;
    }
    const repo = matches[0];
    const namespace = repo.hostname ?? me.username;
    if (!namespace) {
      output.error("Could not resolve the space namespace.");
      return 1;
    }
    const url = `${deriveGitBase(config.apiUrl)}/${namespace}/${repo.slug}.git`;
    const dir = resolve11(args2[1] ?? repo.slug);
    await registerGitCredentialHelper();
    output.progress(`Cloning ${namespace}/${repo.slug}\u2026`);
    try {
      cloneRepo(url, dir);
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    try {
      saveSpace(dir, { repo_id: repo.repo_id, slug: repo.slug, namespace });
    } catch {
      output.error("Clone succeeded but the folder could not be bound \u2014 re-run clone to bind it.");
    }
    if (me.username) {
      try {
        setLocalConfig("user.email", identityEmail(me.username), dir);
        setLocalConfig("user.name", identityName({ name: me.name, username: me.username }), dir);
      } catch {
      }
    }
    output.result({ repo_id: repo.repo_id, slug: repo.slug, namespace, path: dir }, `Cloned ${namespace}/${repo.slug} \u2192 ${dir}`);
    return 0;
  }
};

// dist/commands/clones.js
var clonesCommand = {
  name: "clones",
  description: "List local clones \u2014 which folders are bound to which spaces",
  usage: "ideaspaces clones [--json]",
  examples: [
    "ideaspaces clones",
    "ideaspaces clones --json"
  ],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    const clones = Object.entries(loadSpaces()).map(([path, record]) => ({
      path,
      repo_id: record.repo_id,
      slug: record.slug,
      namespace: record.namespace
    }));
    output.result({ clones }, clones.length ? clones.map((c) => `${c.namespace}/${c.slug}  ${c.path}`).join("\n") : "No local clones yet. `ideaspaces clone <space>` to make one.");
    return 0;
  }
};

// dist/commands/link.js
import { resolve as resolve12 } from "node:path";
function repoKey(repo, me, gitBase) {
  const namespace = repo.hostname ?? me.username;
  if (!namespace)
    return null;
  return normalizeRepoUrl(`${gitBase}/${namespace}/${repo.slug}.git`);
}
var linkCommand = {
  name: "link",
  description: "Bind an existing local clone to one of your spaces",
  usage: "ideaspaces link <dir> [space]",
  examples: [
    "ideaspaces link ./theone                  # auto-detect from the git remote",
    "ideaspaces link ./theone alice/theone     # bind to a specific space"
  ],
  async run(args2, _flags, global2) {
    const output = createOutput(global2);
    const dirArg = args2[0];
    if (!dirArg) {
      output.error("Usage: ideaspaces link <dir> [space]");
      return 1;
    }
    const dir = resolve12(dirArg);
    if (!isInsideWorkTree(dir)) {
      output.error(`${dir} is not a git repository. Use \`clone\` to make one, or point at an existing clone.`);
      return 1;
    }
    const origin = originUrl(dir);
    if (!origin) {
      output.error(`${dir} has no \`origin\` remote \u2014 can't tell which space it belongs to.`);
      return 1;
    }
    const originKey = normalizeRepoUrl(origin);
    if (!originKey) {
      output.error(`Could not parse the origin remote: ${origin}`);
      return 1;
    }
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run `ideaspaces login`.");
      return 1;
    }
    output.progress(`Linking ${dir}\u2026`);
    let me;
    try {
      me = await fetchAuthMe(config);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        output.error("Session expired. Run `ideaspaces login`.");
        return 1;
      }
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    const gitBase = deriveGitBase(config.apiUrl);
    const target = args2[1];
    let repo;
    if (target) {
      const matches = me.repos.filter((r) => {
        const namespace2 = r.hostname ?? me.username;
        return r.repo_id === target || r.slug === target || `${namespace2}/${r.slug}` === target;
      });
      if (matches.length === 0) {
        output.error(`No space matches "${target}". Run \`ideaspaces repos\` to list yours.`);
        return 1;
      }
      if (matches.length > 1) {
        output.error(`"${target}" is ambiguous \u2014 use namespace/slug or the repo_id.`);
        return 1;
      }
      repo = matches[0];
      if (repoKey(repo, me, gitBase) !== originKey) {
        const namespace2 = repo.hostname ?? me.username;
        output.error(`${dir}'s origin (${origin}) doesn't match ${repo.slug}.
Expected a clone of ${gitBase}/${namespace2}/${repo.slug}.git.`);
        return 1;
      }
    } else {
      const matches = me.repos.filter((r) => repoKey(r, me, gitBase) === originKey);
      if (matches.length === 0) {
        output.error(`${dir}'s origin (${origin}) isn't a clone of one of your spaces.
Run \`ideaspaces repos\` to see them, or pass the space explicitly.`);
        return 1;
      }
      if (matches.length > 1) {
        output.error(`${dir}'s origin matches more than one space \u2014 name it: ideaspaces link <dir> <space>.`);
        return 1;
      }
      repo = matches[0];
    }
    const namespace = repo.hostname ?? me.username;
    if (!namespace) {
      output.error("Could not resolve the space namespace.");
      return 1;
    }
    try {
      saveSpace(dir, { repo_id: repo.repo_id, slug: repo.slug, namespace });
    } catch {
      output.error("Verified the folder, but could not write the clone registry.");
      return 1;
    }
    if (me.username) {
      try {
        setLocalConfig("user.email", identityEmail(me.username), dir);
        setLocalConfig("user.name", identityName({ name: me.name, username: me.username }), dir);
      } catch {
      }
    }
    output.result({ repo_id: repo.repo_id, slug: repo.slug, namespace, path: dir }, `Linked ${namespace}/${repo.slug} \u2192 ${dir}`);
    return 0;
  }
};

// dist/commands/forget.js
import { rmSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname3, resolve as resolve13 } from "node:path";
var forgetCommand = {
  name: "forget",
  description: "Stop tracking a local clone (optionally delete its folder)",
  usage: "ideaspaces forget <dir> [--delete]",
  examples: [
    "ideaspaces forget ./theone            # remove the binding, keep the files",
    "ideaspaces forget ./theone --delete   # remove the binding AND delete the folder"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const dirArg = args2[0];
    if (!dirArg) {
      output.error("Usage: ideaspaces forget <dir> [--delete]");
      return 1;
    }
    const dir = resolve13(dirArg);
    const del = Boolean(flags2["delete"]);
    if (del && (dir === resolve13(homedir2()) || dirname3(dir) === dir)) {
      output.error(`Refusing to delete ${dir} \u2014 that's a home or root directory.`);
      return 1;
    }
    const wasTracked = removeSpace(dir);
    if (!wasTracked && !del) {
      output.error(`${dir} is not a tracked clone.`);
      return 1;
    }
    let deleted = false;
    if (del) {
      try {
        rmSync(dir, { recursive: true, force: true });
        deleted = true;
      } catch (err) {
        output.error(`Removed the binding, but couldn't delete ${dir}: ${err instanceof Error ? err.message : String(err)}`);
        return 1;
      }
    }
    output.result({ forgotten: true, deleted, path: dir }, deleted ? `Freed up space \u2014 deleted ${dir}.` : `Forgot ${dir} (files kept).`);
    return 0;
  }
};

// dist/commands/conversations.js
function makeConversationsCommand(local) {
  return {
    name: "conversations",
    description: "List a repo's conversations (--local for the current context)",
    usage: "ideaspaces conversations <repo_id> [--json] | conversations --local [--context <path>]",
    examples: [
      "ideaspaces conversations repo_abc123",
      "ideaspaces conversations repo_abc123 --json",
      "ideaspaces conversations --local"
    ],
    async run(args2, flags2, global2) {
      const output = createOutput(global2);
      if (flags2.local)
        return local.list(flags2, output);
      const repoId = args2[0];
      if (!repoId) {
        output.error("Usage: ideaspaces conversations <repo_id>");
        return 1;
      }
      const config = loadConfig();
      if (!config) {
        output.error("Not logged in. Run `ideaspaces login`.");
        return 1;
      }
      let res;
      try {
        res = await fetchConversations(config, repoId);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          output.error("Session expired. Run `ideaspaces login`.");
          return 1;
        }
        output.error(err instanceof Error ? err.message : String(err));
        return 1;
      }
      const { conversations, total } = res;
      const has_more = total > conversations.length;
      output.result({ repo_id: repoId, conversations, total, has_more }, conversations.length ? conversations.map((c) => `${c.name || "(untitled)"} \u2014 ${c.message_count} message${c.message_count === 1 ? "" : "s"}`).join("\n") + (has_more ? `
\u2026 and ${total - conversations.length} more` : "") : "No conversations.");
      return 0;
    }
  };
}

// dist/commands/conversation.js
function toPrincipal(actor) {
  return /^(person|agent|node):/.test(actor) ? actor : `person:${actor}`;
}
function parseRole(value) {
  if (value === void 0 || value === "member")
    return "member";
  if (value === "reader")
    return "reader";
  return null;
}
function requireConfig(output) {
  const config = loadConfig();
  if (!config) {
    output.error("Not logged in. Run `ideaspaces login`.");
    return null;
  }
  return config;
}
function reportError(err, output) {
  if (err instanceof UnauthorizedError) {
    output.error("Session expired. Run `ideaspaces login`.");
    return 1;
  }
  output.error(err instanceof Error ? err.message : String(err));
  return 1;
}
async function cmdNew2(args2, flags2, output) {
  const repoId = args2[0];
  if (!repoId) {
    output.error("Usage: ideaspaces conversation new <repo_id> [--name <name>] [--agent <node_id>]");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  const body = {};
  if (typeof flags2.name === "string")
    body.name = flags2.name;
  if (typeof flags2.agent === "string")
    body.agent_node_id = flags2.agent;
  try {
    const conv = await createConversation(config, repoId, body);
    output.result(conv, `Created conversation ${conv.name || "(untitled)"} (${conv.conversation_id})`);
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
async function cmdParticipants(args2, output) {
  const [repoId, convId] = args2;
  if (!repoId || !convId) {
    output.error("Usage: ideaspaces conversation participants <repo_id> <conversation_id>");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  try {
    const res = await listParticipants(config, repoId, convId);
    output.result(res, res.participants.length ? res.participants.map((p) => `${p.participant} \u2014 ${p.role}`).join("\n") : "No participants.");
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
async function cmdAdd(args2, flags2, output) {
  const [repoId, convId, actor] = args2;
  if (!repoId || !convId || !actor) {
    output.error("Usage: ideaspaces conversation add <repo_id> <conversation_id> <username|principal> [--role member|reader]");
    return 1;
  }
  const role = parseRole(flags2.role);
  if (role === null) {
    output.error("--role must be 'member' or 'reader'.");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  const participant = toPrincipal(actor);
  try {
    const p = await addParticipant(config, repoId, convId, participant, role);
    output.result(p, `Added ${p.participant} as ${p.role}`);
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
async function cmdRemove(args2, output) {
  const [repoId, convId, actor] = args2;
  if (!repoId || !convId || !actor) {
    output.error("Usage: ideaspaces conversation remove <repo_id> <conversation_id> <username|principal>");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  const participant = toPrincipal(actor);
  try {
    const p = await removeParticipant(config, repoId, convId, participant);
    output.result(p, `Removed ${participant}`);
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
async function cmdMembers(args2, output) {
  const repoId = args2[0];
  if (!repoId) {
    output.error("Usage: ideaspaces conversation members <repo_id>");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  try {
    const members = await fetchRepoMembers(config, repoId);
    output.result({ repo_id: repoId, members }, members.length ? members.map((m) => `${m.username ?? m.email ?? `user ${m.user_id}`} \u2014 ${m.role}`).join("\n") : "No members.");
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
async function cmdSend(args2, flags2, output) {
  const [repoId, convId] = args2;
  if (!repoId || !convId) {
    output.error("Usage: ideaspaces conversation send <repo_id> <conversation_id> --message <text> [--model opus] [--thinking]");
    return 1;
  }
  const message = typeof flags2.message === "string" ? flags2.message : void 0;
  if (!message) {
    output.error("A message is required: --message <text>");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  const body = {
    message,
    ...typeof flags2.model === "string" ? { model_tier: flags2.model } : {},
    // `--thinking` parses to boolean true; `--thinking=true` to the string "true".
    ...flags2.thinking === true || flags2.thinking === "true" ? { thinking: true } : {}
  };
  const controller = new AbortController();
  let signalled = false;
  const onSignal = () => {
    if (signalled)
      return;
    signalled = true;
    controller.abort();
    void cancelConversationTurn(config, repoId, convId).catch(() => {
    });
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  try {
    for await (const event of streamConversationMessage(config, repoId, convId, body, controller.signal)) {
      process.stdout.write(JSON.stringify(event) + "\n");
    }
    return 0;
  } catch (err) {
    if (controller.signal.aborted)
      return 0;
    return reportError(err, output);
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}
async function cmdGet(args2, output) {
  const [repoId, convId] = args2;
  if (!repoId || !convId) {
    output.error("Usage: ideaspaces conversation get <repo_id> <conversation_id>");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  try {
    const detail = await getConversation(config, repoId, convId);
    output.result(detail, detail.history.length ? detail.history.map((m) => {
      const preview = m.content.replace(/\s+/g, " ");
      return `${m.role}: ${preview.length > 80 ? preview.slice(0, 79) + "\u2026" : preview}`;
    }).join("\n") : "No messages yet.");
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
async function cmdCancel(args2, output) {
  const [repoId, convId] = args2;
  if (!repoId || !convId) {
    output.error("Usage: ideaspaces conversation cancel <repo_id> <conversation_id>");
    return 1;
  }
  const config = requireConfig(output);
  if (!config)
    return 1;
  try {
    const res = await cancelConversationTurn(config, repoId, convId);
    output.result(res, `Cancel: ${res.status}`);
    return 0;
  } catch (err) {
    return reportError(err, output);
  }
}
var USAGE2 = "ideaspaces conversation <new|participants|add|remove|members|send|get|cancel> \u2026 (send --local for a local pi turn)";
function makeConversationCommand(local) {
  return {
    name: "conversation",
    description: "Create a conversation and manage its participants",
    usage: USAGE2,
    examples: [
      "ideaspaces conversation new repo_abc --name 'Kickoff'",
      "ideaspaces conversation new repo_abc --agent agent_node_xyz  # pick the agent",
      "ideaspaces conversation members repo_abc          # who you can add",
      "ideaspaces conversation add repo_abc c_123 alice  # add a person",
      "ideaspaces conversation participants repo_abc c_123",
      "ideaspaces conversation remove repo_abc c_123 alice",
      "ideaspaces conversation send repo_abc c_123 --message 'Hi'  # streams JSON lines",
      "ideaspaces conversation send --local --context /ws --conversation c1 --message 'Hi' --ext a,b --skill a/skills,b/skills --pi-bin /path/pi --pi-model sonnet --pi-thinking high  # local pi turn",
      "ideaspaces conversation get repo_abc c_123        # detail + history",
      "ideaspaces conversation cancel repo_abc c_123     # stop the active turn"
    ],
    async run(args2, flags2, global2) {
      const output = createOutput(global2);
      const [sub, ...rest] = args2;
      switch (sub) {
        case "new":
          return flags2.local ? local.createNew(output) : cmdNew2(rest, flags2, output);
        case "participants":
          return cmdParticipants(rest, output);
        case "add":
          return cmdAdd(rest, flags2, output);
        case "remove":
          return cmdRemove(rest, output);
        case "members":
          return cmdMembers(rest, output);
        case "send":
          return flags2.local ? local.send(flags2, output) : cmdSend(rest, flags2, output);
        case "get":
          return flags2.local ? local.get(flags2, output) : cmdGet(rest, output);
        case "cancel":
          return cmdCancel(rest, output);
        default:
          output.error(`Usage: ${USAGE2}`);
          return 1;
      }
    }
  };
}

// dist/commands/agents.js
var agentsCommand = {
  name: "agents",
  description: "List Agent Actors you can use to run a conversation",
  usage: "ideaspaces agents [--owner <person:user|hostname:domain>] [--json]",
  examples: [
    "ideaspaces agents",
    "ideaspaces agents --owner hostname:acme.com",
    "ideaspaces agents --json"
  ],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const config = loadConfig();
    if (!config) {
      output.error("Not logged in. Run `ideaspaces login`.");
      return 1;
    }
    const owner = typeof flags2.owner === "string" ? flags2.owner : void 0;
    let agents;
    try {
      agents = await fetchAgents(config, owner);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        output.error("Session expired. Run `ideaspaces login`.");
        return 1;
      }
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
    output.result({ agents }, agents.length ? agents.map((a) => `${a.name}${a.is_default ? " (default)" : ""}${a.can_use ? "" : " \u2014 no access"} \u2192 ${a.node_id}`).join("\n") : "No agents.");
    return 0;
  }
};

// dist/commands/node.js
var USAGE3 = "ideaspaces node <get <repo_id> <node_id> | put <repo_id> <path> --content ...>";
var USAGE_GET = "ideaspaces node get <repo_id> <node_id>";
var USAGE_PUT = "ideaspaces node put <repo_id> <path> [--content TEXT]  (else reads stdin)";
async function readStdin3() {
  if (process.stdin.isTTY)
    return "";
  const chunks = [];
  for await (const chunk of process.stdin)
    chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}
async function cmdGet2(args2, output) {
  const [repoId, nodeId] = args2;
  if (!repoId || !nodeId) {
    output.error(`Usage: ${USAGE_GET}`);
    return 1;
  }
  const config = loadConfig();
  if (!config) {
    output.error("Not logged in. Run `ideaspaces login`.");
    return 1;
  }
  try {
    const node = await fetchNode(config, repoId, nodeId);
    const preview = node.content.replace(/\s+/g, " ").trim();
    const snippet = preview.length > 120 ? `${preview.slice(0, 119)}\u2026` : preview;
    const header = `${node.name_display || node.name} (${node.path})`;
    output.result(node, snippet ? `${header}
${snippet}` : header);
    return 0;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      output.error("Session expired. Run `ideaspaces login`.");
      return 1;
    }
    output.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}
async function cmdPut(args2, flags2, output) {
  const [repoId, path] = args2;
  if (!repoId || !path) {
    output.error(`Usage: ${USAGE_PUT}`);
    return 1;
  }
  const content = typeof flags2.content === "string" ? flags2.content : await readStdin3();
  const config = loadConfig();
  if (!config) {
    output.error("Not logged in. Run `ideaspaces login`.");
    return 1;
  }
  try {
    const res = await putFile(config, repoId, path, content);
    output.result(res, `Saved ${res.path}`);
    return 0;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      output.error("Session expired. Run `ideaspaces login`.");
      return 1;
    }
    output.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}
var nodeCommand = {
  name: "node",
  description: "Resolve (get) or write (put) a note \u2014 by id or path (use --json for the full node)",
  usage: USAGE3,
  examples: [
    "ideaspaces node get repo_abc node_xyz --json",
    "ideaspaces node put repo_abc notes/a.md --content '# Hi'",
    "cat a.md | ideaspaces node put repo_abc notes/a.md --json"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const [sub, ...rest] = args2;
    switch (sub) {
      case "get":
        return cmdGet2(rest, output);
      case "put":
        return cmdPut(rest, flags2, output);
      default:
        output.error(`Usage: ${USAGE3}`);
        return 1;
    }
  }
};

// dist/commands/search.js
import { readFileSync as readFileSync3 } from "node:fs";
import { join as join12 } from "node:path";

// dist/search.js
var K1 = 1.2;
var B = 0.75;
var NAME_BOOST = 2;
var SNIPPET_MAX = 200;
function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}
function idf(n, df) {
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}
function nameTokens(path) {
  const base = path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
  return new Set(tokenize(base));
}
function searchDocs(docs, query, limit = 20) {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0)
    return [];
  const termSet = new Set(terms);
  let n = 0;
  let totalLen = 0;
  const df = /* @__PURE__ */ new Map();
  const hits = [];
  for (const doc of docs) {
    n++;
    const lines = doc.content.split("\n");
    const tf = /* @__PURE__ */ new Map();
    let length = 0;
    let bestLine = "";
    let bestLineNo = null;
    let bestLineHits = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineTokens = tokenize(lines[i]);
      length += lineTokens.length;
      let lineHits = 0;
      for (const tok of lineTokens) {
        if (termSet.has(tok)) {
          tf.set(tok, (tf.get(tok) ?? 0) + 1);
          lineHits++;
        }
      }
      if (lineHits > bestLineHits) {
        bestLineHits = lineHits;
        bestLine = lines[i].trim();
        bestLineNo = i + 1;
      }
    }
    totalLen += length;
    for (const term of tf.keys())
      df.set(term, (df.get(term) ?? 0) + 1);
    const nameHitSet = nameTokens(doc.path);
    let nameHits = 0;
    for (const term of terms)
      if (nameHitSet.has(term))
        nameHits++;
    if (tf.size > 0 || nameHits > 0) {
      const snippet = bestLine.length > SNIPPET_MAX ? `${bestLine.slice(0, SNIPPET_MAX - 1)}\u2026` : bestLine;
      hits.push({ path: doc.path, length, tf, nameHits, snippet, line: bestLineNo });
    }
  }
  if (n === 0)
    return [];
  const avgdl = totalLen / n || 1;
  const scored = hits.map((h) => {
    let bm25 = 0;
    for (const [term, freq] of h.tf) {
      const norm = freq + K1 * (1 - B + B * h.length / avgdl);
      bm25 += idf(n, df.get(term) ?? 0) * (freq * (K1 + 1) / norm);
    }
    return {
      path: h.path,
      score: bm25 + h.nameHits * NAME_BOOST,
      body_hits: h.tf.size,
      name_hits: h.nameHits,
      snippet: h.snippet,
      line: h.line
    };
  });
  scored.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return scored.slice(0, Math.max(0, limit));
}

// dist/commands/search.js
var USAGE4 = "ideaspaces search <query> [--limit N] [--json]";
var DEFAULT_LIMIT = 20;
function* readDocs(root, paths) {
  for (const path of paths) {
    try {
      yield { path, content: readFileSync3(join12(root, path), "utf-8") };
    } catch {
      continue;
    }
  }
}
var searchCommand = {
  name: "search",
  description: "Search the current repo's Markdown locally (filename + BM25 full-text)",
  usage: USAGE4,
  examples: [
    "ideaspaces search awareness loop",
    'ideaspaces search "state and location" --limit 5',
    "ideaspaces search conversation --json"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const query = args2.join(" ").trim();
    if (!query) {
      output.error(`Usage: ${USAGE4}`);
      return 1;
    }
    let root;
    try {
      root = repoRoot();
    } catch (err) {
      output.error(err instanceof GitError ? err.message : String(err));
      return 1;
    }
    const rawLimit = typeof flags2.limit === "string" ? Number.parseInt(flags2.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT;
    const markdown = listFiles(root).filter((p) => p.endsWith(".md"));
    const results = searchDocs(readDocs(root, markdown), query, limit);
    const data = { query, scanned: markdown.length, total: results.length, results };
    if (results.length === 0) {
      output.result(data, `No matches for "${query}" (${markdown.length} files searched).`);
      return 0;
    }
    const lines = results.map((r) => {
      const where = r.line ? `:${r.line}` : "";
      const head = `${r.path}${where}`;
      return r.snippet ? `${head}
    ${r.snippet}` : head;
    });
    output.result(data, lines.join("\n"));
    return 0;
  }
};

// dist/commands/ls.js
import { statSync as statSync4 } from "node:fs";
import { resolve as resolve14 } from "node:path";

// dist/file-listing.js
import { existsSync as existsSync9, readdirSync } from "node:fs";
import { join as join13, relative as relative7 } from "node:path";
var EXCLUDES = new Set(AUTOCOMPLETE_EXCLUDES);
var DEFAULT_MAX_SCAN = 5e3;
var DEFAULT_MAX_DEPTH = 10;
function folderKind(abs) {
  if (existsSync9(join13(abs, "_agent")))
    return "ideaspace-repo";
  if (existsSync9(join13(abs, ".git")))
    return "code-repo";
  return "folder";
}
function toPosix(rel) {
  return rel.split(/[\\/]/).join("/");
}
function listEntries(root, opts = {}) {
  const maxScan = opts.maxScan ?? DEFAULT_MAX_SCAN;
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  const entries = [];
  const queue = [{ abs: root, depth: 0 }];
  for (let head = 0; head < queue.length; head++) {
    const { abs, depth } = queue[head];
    let dirents;
    try {
      dirents = readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    dirents.sort((a, b) => a.name.localeCompare(b.name));
    for (const dirent of dirents) {
      if (dirent.name.startsWith(".") || EXCLUDES.has(dirent.name))
        continue;
      if (entries.length >= maxScan)
        return { entries, truncated: true };
      const childAbs = join13(abs, dirent.name);
      const path = toPosix(relative7(root, childAbs));
      if (dirent.isDirectory()) {
        entries.push({ path, name: dirent.name, kind: folderKind(childAbs) });
        if (depth + 1 <= maxDepth)
          queue.push({ abs: childAbs, depth: depth + 1 });
      } else if (dirent.isFile()) {
        entries.push({ path, name: dirent.name, kind: "file" });
      }
    }
  }
  return { entries, truncated: false };
}
function scoreEntry(entry, query) {
  const name = entry.name.toLowerCase();
  const path = entry.path.toLowerCase();
  if (name === query)
    return 100;
  if (name.startsWith(query))
    return 80;
  if (name.includes(query))
    return 60;
  if (path.includes(query))
    return 40;
  return 0;
}
function filterEntries(entries, query, limit) {
  const q = query.trim().toLowerCase();
  if (!q)
    return entries.slice(0, limit);
  const scored = [];
  for (const entry of entries) {
    const score = scoreEntry(entry, q);
    if (score > 0)
      scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path));
  return scored.slice(0, limit).map((s) => s.entry);
}
function entryLabel(entry) {
  const tag = entry.kind === "ideaspace-repo" ? " (ideaspace)" : entry.kind === "code-repo" ? " (repo)" : entry.kind === "folder" ? "/" : "";
  return `${entry.path}${tag}`;
}

// dist/commands/ls.js
var USAGE5 = "ideaspaces ls [<path>] [--query <q>] [--limit N] [--json]";
var DEFAULT_LIMIT2 = 25;
var lsCommand = {
  name: "ls",
  description: "List files and folders under a path (typed; powers @-mention autocomplete)",
  usage: USAGE5,
  examples: [
    "ideaspaces ls",
    "ideaspaces ls ~/IdeaSpaces --json",
    "ideaspaces ls . --query awareness --limit 8 --json"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const root = resolve14(args2[0] ?? ".");
    try {
      if (!statSync4(root).isDirectory()) {
        output.error(`Not a directory: ${root}`);
        return 1;
      }
    } catch (err) {
      const code = err.code;
      output.error(code === "ENOENT" ? `No such directory: ${root}` : `Cannot read ${root}: ${String(err)}`);
      return 1;
    }
    const query = typeof flags2.query === "string" ? flags2.query : "";
    const rawLimit = typeof flags2.limit === "string" ? Number.parseInt(flags2.limit, 10) : NaN;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT2;
    const { entries: scanned, truncated } = listEntries(root);
    const entries = filterEntries(scanned, query, limit);
    const data = { root, query, scanned: scanned.length, truncated, total: entries.length, entries };
    if (entries.length === 0) {
      const detail = query ? ` matching "${query}"` : "";
      output.result(data, `No files or folders${detail} under ${root}.`);
      return 0;
    }
    output.result(data, entries.map(entryLabel).join("\n"));
    return 0;
  }
};

// dist/commands/times.js
var timesCommand = {
  name: "times",
  description: "Per-note git created/updated times (first & last commit) for this clone",
  usage: "ideaspaces times [--json]",
  examples: ["ideaspaces times --json"],
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    let root;
    try {
      root = repoRoot();
    } catch (err) {
      output.error(err instanceof GitError ? err.message : err instanceof Error ? err.message : String(err));
      return 1;
    }
    const files = fileTimes(root);
    const human = files.length ? files.map((f) => `${new Date(f.updated_at).toISOString().slice(0, 10)}  ${f.path}`).join("\n") : "no tracked notes";
    output.result({ files }, human);
    return 0;
  }
};

// dist/commands/share.js
var USAGE6 = "ideaspaces share <access|set-access|members|remove|invites|invite|revoke> <repo_id> \u2026";
var INVITE_ROLES = ["MEMBER", "CLONER", "READER"];
var COPY_LEVELS = ["owner", "member", "reader", "public"];
function flagStr(flags2, key) {
  return typeof flags2[key] === "string" ? flags2[key] : void 0;
}
function setup(repoId, usage, output) {
  if (!repoId) {
    output.error(`Usage: ${usage}`);
    return null;
  }
  const config = loadConfig();
  if (!config) {
    output.error("Not logged in. Run `ideaspaces login`.");
    return null;
  }
  return config;
}
async function run(sub, rest, flags2, output) {
  const [repoId, arg] = rest;
  try {
    switch (sub) {
      case "access": {
        const config = setup(repoId, "ideaspaces share access <repo_id>", output);
        if (!config)
          return 1;
        const a = await getSpaceAccess(config, repoId);
        output.result(a, `read: ${a.read_public ? "public" : "private"}
copy: ${a.copy_access}
root: ${a.root_node_id}`);
        return 0;
      }
      case "set-access": {
        const config = setup(repoId, "ideaspaces share set-access <repo_id> --public <bool> --copy <level>", output);
        if (!config)
          return 1;
        const publicRaw = flagStr(flags2, "public") ?? (flags2.public === true ? "true" : void 0);
        const copy = flagStr(flags2, "copy");
        if (publicRaw === void 0 || !copy) {
          output.error("Both --public <bool> and --copy <level> are required.");
          return 1;
        }
        if (!COPY_LEVELS.includes(copy)) {
          output.error(`--copy must be one of: ${COPY_LEVELS.join(", ")}`);
          return 1;
        }
        const read_public = publicRaw === "true";
        const a = await setSpaceAccess(config, repoId, { read_public, copy_access: copy });
        output.result(a, `read: ${a.read_public ? "public" : "private"}
copy: ${a.copy_access}`);
        return 0;
      }
      case "members": {
        const config = setup(repoId, "ideaspaces share members <repo_id>", output);
        if (!config)
          return 1;
        const members = await listRepoMembers(config, repoId);
        const human = members.length ? members.map((m) => `${m.role.padEnd(7)} ${m.username ?? m.email ?? `user ${m.user_id}`}`).join("\n") : "no members";
        output.result({ members }, human);
        return 0;
      }
      case "remove": {
        const config = setup(repoId, "ideaspaces share remove <repo_id> <user_id>", output);
        if (!config)
          return 1;
        const userId = Number(arg);
        if (!arg || !Number.isInteger(userId)) {
          output.error("Usage: ideaspaces share remove <repo_id> <user_id>");
          return 1;
        }
        await removeRepoMember(config, repoId, userId);
        output.result({ removed: userId }, `Removed user ${userId}`);
        return 0;
      }
      case "invites": {
        const config = setup(repoId, "ideaspaces share invites <repo_id>", output);
        if (!config)
          return 1;
        const invites = await listRepoInvites(config, repoId);
        const human = invites.length ? invites.map((i) => `${i.role.padEnd(7)} ${i.invited_email}`).join("\n") : "no pending invites";
        output.result({ invites }, human);
        return 0;
      }
      case "invite": {
        const config = setup(repoId, "ideaspaces share invite <repo_id> <email\u2026> --role <role>", output);
        if (!config)
          return 1;
        const emails = rest.slice(1).filter(Boolean);
        const role = flagStr(flags2, "role") ?? "READER";
        if (!emails.length) {
          output.error("Usage: ideaspaces share invite <repo_id> <email\u2026> --role <role>");
          return 1;
        }
        if (!INVITE_ROLES.includes(role)) {
          output.error(`--role must be one of: ${INVITE_ROLES.join(", ")}`);
          return 1;
        }
        const res = await createRepoInvites(config, repoId, emails, role);
        const human = res.results.map((r) => `${r.status.padEnd(16)} ${r.email}`).join("\n");
        output.result(res, human);
        return 0;
      }
      case "revoke": {
        const config = setup(repoId, "ideaspaces share revoke <repo_id> <invite_id>", output);
        if (!config)
          return 1;
        if (!arg) {
          output.error("Usage: ideaspaces share revoke <repo_id> <invite_id>");
          return 1;
        }
        await revokeRepoInvite(config, repoId, arg);
        output.result({ revoked: arg }, `Revoked invite ${arg}`);
        return 0;
      }
      default:
        output.error(`Usage: ${USAGE6}`);
        return 1;
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      output.error("Session expired. Run `ideaspaces login`.");
      return 1;
    }
    output.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}
var shareCommand = {
  name: "share",
  description: "Manage repo access \u2014 members, invites, and the public-link policy",
  usage: USAGE6,
  examples: [
    "ideaspaces share access repo_abc --json",
    "ideaspaces share set-access repo_abc --public true --copy reader",
    "ideaspaces share members repo_abc --json",
    "ideaspaces share invite repo_abc a@x.com b@x.com --role MEMBER",
    "ideaspaces share revoke repo_abc inv_123"
  ],
  async run(args2, flags2, global2) {
    const output = createOutput(global2);
    const [sub, ...rest] = args2;
    return run(sub ?? "", rest, flags2, output);
  }
};

// dist/auth/session-state.js
import { existsSync as existsSync10, unlinkSync as unlinkSync2 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { join as join14 } from "node:path";
var SESSION_FILE = join14(homedir3(), ".ideaspaces", "session.json");
function clearSessionState() {
  try {
    if (existsSync10(SESSION_FILE))
      unlinkSync2(SESSION_FILE);
  } catch {
  }
}

// dist/commands/power/logout.js
var logoutCommand = {
  name: "logout",
  description: "Log out and clear stored credentials",
  usage: "ideaspaces power logout",
  async run(_args, _flags, global2) {
    const output = createOutput(global2);
    deleteCredentials();
    clearSessionState();
    output.result({ logged_out: true }, "Logged out. Credentials and session state removed.");
    return 0;
  }
};

// dist/pi/pi-status.js
import { spawnSync as spawnSync5 } from "node:child_process";
import { existsSync as existsSync12, readFileSync as readFileSync5 } from "node:fs";
import { basename as basename4, join as join16 } from "node:path";

// dist/pi/pi-auth.js
import { chmodSync, existsSync as existsSync11, mkdirSync as mkdirSync3, readFileSync as readFileSync4, writeFileSync as writeFileSync3 } from "node:fs";
import { homedir as homedir4 } from "node:os";
import { dirname as dirname4, join as join15 } from "node:path";
function resolvePiAgentDir(env = process.env) {
  const override = env.PI_CODING_AGENT_DIR?.trim();
  if (override)
    return override.startsWith("~") ? join15(homedir4(), override.slice(1)) : override;
  return join15(homedir4(), ".pi", "agent");
}
function resolvePiAuthPath(env = process.env) {
  return join15(resolvePiAgentDir(env), "auth.json");
}
function parseAuth(raw) {
  if (!raw || !raw.trim())
    return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
function upsertApiKey(current, provider, key) {
  return { ...current, [provider]: { type: "api_key", key } };
}
function removeProvider(current, provider) {
  if (!(provider in current))
    return { next: current, removed: false };
  const next = { ...current };
  delete next[provider];
  return { next, removed: true };
}
function readAuthFile(path) {
  if (!existsSync11(path))
    return {};
  return parseAuth(readFileSync4(path, "utf8"));
}
function writeAuthFile(path, auth) {
  const dir = dirname4(path);
  if (!existsSync11(dir))
    mkdirSync3(dir, { recursive: true, mode: 448 });
  writeFileSync3(path, `${JSON.stringify(auth, null, 2)}
`, { encoding: "utf8", mode: 384 });
  chmodSync(path, 384);
}

// dist/pi/pi-status.js
function derivePiStatus(input) {
  const providers = Object.entries(input.auth ?? {}).map(([name, v]) => {
    const hasCreds = Boolean(v && (v.key || v.access || v.refresh));
    const expiresAt = typeof v?.expires === "number" ? v.expires : null;
    return { name, hasCreds, expiresAt, expired: expiresAt != null && expiresAt <= input.now };
  });
  const configured = providers.some((p) => p.hasCreds);
  const extensionsResolvable = input.extensions.length > 0 && input.extensions.every((e) => e.resolvable);
  return {
    binary: input.binary,
    providers,
    configured,
    extensions: input.extensions,
    extensionsResolvable,
    ready: input.binary.present && configured
  };
}
function resolveExtension(path) {
  const name = basename4(path.replace(/[/\\]+$/, "")) || path;
  const check = (resolvable) => ({ name, path, resolvable });
  if (!existsSync12(path))
    return check(false);
  if (/\.[cm]?[jt]s$/.test(path))
    return check(true);
  const pkgPath = join16(path, "package.json");
  if (existsSync12(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync5(pkgPath, "utf8"));
      const exts = pkg.pi?.extensions;
      if (Array.isArray(exts) && exts.length > 0)
        return check(true);
    } catch {
    }
  }
  return check(existsSync12(join16(path, "index.ts")) || existsSync12(join16(path, "index.js")));
}
function probeBinary(piBin) {
  try {
    const res = spawnSync5(piBin, ["--version"], { encoding: "utf8", timeout: 5e3 });
    if (res.error || res.status !== 0)
      return { present: false, path: piBin, version: null };
    const m = /\d+\.\d+\.\d+[\w.-]*/.exec(res.stdout ?? "");
    return { present: true, path: piBin, version: m ? m[0] : null };
  } catch {
    return { present: false, path: piBin, version: null };
  }
}
function formatHuman2(s) {
  const out = [];
  out.push(s.binary.present ? `Pi: present${s.binary.version ? ` (${s.binary.version})` : ""} \u2014 ${s.binary.path}` : `Pi: not found (${s.binary.path}). Install pi to enable the local agent.`);
  if (s.providers.length) {
    const list2 = s.providers.map((p) => `${p.name}${!p.hasCreds ? " (no creds)" : p.expired ? " (expired)" : ""}`).join(", ");
    out.push(`Configured: ${s.configured ? "yes" : "no"} \u2014 providers: ${list2}`);
  } else {
    out.push("Configured: no \u2014 no providers in ~/.pi/agent/auth.json");
  }
  if (s.extensions.length) {
    const list2 = s.extensions.map((e) => `${e.name} (${e.resolvable ? "ok" : "missing"})`).join(", ");
    out.push(`Extensions: ${list2}`);
  } else {
    out.push("Extensions: none checked \u2014 pass --ext or set IDEASPACES_PI_EXTENSIONS");
  }
  out.push(`Ready: ${s.ready ? "yes" : "no"}`);
  return out.join("\n");
}
var piStatusCommand = {
  name: "pi-status",
  description: "Is the local pi runtime usable for a local agent? (binary, providers, extensions)",
  usage: "ideaspaces pi-status [--pi-bin <path>] [--ext <p1,p2>] [--json]",
  examples: [
    "ideaspaces pi-status",
    "ideaspaces pi-status --json",
    "ideaspaces pi-status --ext /path/pi-is-space,/path/pi-local-context",
    "IDEASPACES_PI_EXTENSIONS=/path/pi-is-space,/path/pi-local-context ideaspaces pi-status  # env fallback"
  ],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const piBin = typeof flags2["pi-bin"] === "string" ? flags2["pi-bin"] : "pi";
    const binary = probeBinary(piBin);
    const auth = readAuthFile(resolvePiAuthPath());
    const extFlag = typeof flags2.ext === "string" ? flags2.ext : process.env.IDEASPACES_PI_EXTENSIONS;
    const extensions = (extFlag ?? "").split(",").map((s) => s.trim()).filter(Boolean).map(resolveExtension);
    const status = derivePiStatus({ binary, auth, extensions, now: Date.now() });
    output.result(status, formatHuman2(status));
    return 0;
  }
};

// dist/pi/pi-login.js
var piLoginCommand = {
  name: "pi-login",
  description: "Configure a local-agent model provider (writes pi's auth.json)",
  usage: "ideaspaces pi-login --provider <id> --api-key <key> [--json]",
  examples: [
    "ideaspaces pi-login --provider anthropic --api-key sk-ant-\u2026",
    "ideaspaces pi-login --provider openai --api-key sk-\u2026"
  ],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const provider = typeof flags2.provider === "string" ? flags2.provider.trim() : "";
    const apiKey = typeof flags2["api-key"] === "string" ? flags2["api-key"].trim() : "";
    if (!provider) {
      output.error("Usage: ideaspaces pi-login --provider <id> --api-key <key>");
      return 1;
    }
    if (!apiKey) {
      output.error(`An API key is required: ideaspaces pi-login --provider ${provider} --api-key <key>`);
      return 1;
    }
    const path = resolvePiAuthPath();
    const next = upsertApiKey(readAuthFile(path), provider, apiKey);
    try {
      writeAuthFile(path, next);
    } catch (err) {
      output.error(`Couldn't write ${path}: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    output.result({ provider, method: "api_key", configured: true, authPath: path }, `Configured ${provider} with an API key. Run \`ideaspaces pi-status\` to confirm.`);
    return 0;
  }
};

// dist/pi/pi-logout.js
var piLogoutCommand = {
  name: "pi-logout",
  description: "Remove a local-agent model provider from pi's auth.json",
  usage: "ideaspaces pi-logout --provider <id> [--json]",
  examples: ["ideaspaces pi-logout --provider anthropic"],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const provider = typeof flags2.provider === "string" ? flags2.provider.trim() : "";
    if (!provider) {
      output.error("Usage: ideaspaces pi-logout --provider <id>");
      return 1;
    }
    const path = resolvePiAuthPath();
    const { next, removed } = removeProvider(readAuthFile(path), provider);
    if (!removed) {
      output.result({ provider, removed: false, authPath: path }, `${provider} was not configured \u2014 nothing to remove.`);
      return 0;
    }
    try {
      writeAuthFile(path, next);
    } catch (err) {
      output.error(`Couldn't write ${path}: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    output.result({ provider, removed: true, authPath: path }, `Removed ${provider} from pi's providers.`);
    return 0;
  }
};

// dist/pi/pi-models.js
import { spawn as spawn2 } from "node:child_process";
import { createInterface } from "node:readline";
function trimModel(m) {
  return {
    ref: `${m.provider}/${m.id}`,
    id: m.id,
    name: m.name ?? m.id,
    provider: m.provider,
    contextWindow: m.contextWindow ?? 0,
    maxTokens: m.maxTokens ?? 0,
    reasoning: !!m.reasoning,
    image: (m.input ?? []).includes("image"),
    cost: m.cost ? { input: m.cost.input ?? 0, output: m.cost.output ?? 0 } : void 0
  };
}
var QUERY_ID = "__models";
var TIMEOUT_MS = 2e4;
function queryPiModels(piBin) {
  return new Promise((resolve15, reject) => {
    const pi = spawn2(piBin, ["--mode", "rpc", "--no-extensions"], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stderr = "";
    let settled = false;
    const finish = (fn) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      try {
        pi.kill("SIGTERM");
      } catch {
      }
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("pi did not return models within the timeout"))), TIMEOUT_MS);
    pi.stderr.on("data", (d) => {
      stderr += String(d);
    });
    pi.on("error", (err) => finish(() => reject(err.code === "ENOENT" ? new Error("pi not found \u2014 check the runtime with `ideaspaces pi-status`") : err)));
    pi.on("exit", (code) => {
      if (settled)
        return;
      finish(() => reject(new Error(stderr.trim() || `pi exited (${code ?? "unknown"}) before returning models`)));
    });
    const rl = createInterface({ input: pi.stdout, terminal: false });
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed)
        return;
      let msg;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        return;
      }
      if (msg.type === "response" && msg.command === "get_available_models") {
        if (msg.success === false) {
          finish(() => reject(new Error(String(msg.error ?? "get_available_models failed"))));
          return;
        }
        const data = msg.data;
        const models = (data?.models ?? []).map(trimModel);
        finish(() => resolve15({ models }));
      }
    });
    try {
      pi.stdin.write(`${JSON.stringify({ type: "get_available_models", id: QUERY_ID })}
`);
    } catch {
      finish(() => reject(new Error("could not send the query to pi")));
    }
  });
}
function formatHuman3(result) {
  if (!result.models.length)
    return "No models available \u2014 configure a provider (see `pi-status`).";
  return result.models.map((m) => {
    const tags = [m.reasoning ? "thinking" : null, m.image ? "images" : null].filter(Boolean).join(", ");
    return `${m.ref}${m.name !== m.id ? `  (${m.name})` : ""}${tags ? `  \xB7 ${tags}` : ""}`;
  }).join("\n");
}
var piModelsCommand = {
  name: "pi-models",
  description: "List the models a local Pi turn can use (auth-gated), for a model picker.",
  usage: "ideaspaces pi-models [--pi-bin <path>] [--json]",
  examples: ["ideaspaces pi-models --json", "ideaspaces pi-models  # human-readable"],
  async run(_args, flags2, global2) {
    const output = createOutput(global2);
    const piBin = typeof flags2["pi-bin"] === "string" ? flags2["pi-bin"] : "pi";
    try {
      const result = await queryPiModels(piBin);
      output.result(result, formatHuman3(result));
      return 0;
    } catch (err) {
      output.error(err instanceof Error ? err.message : String(err));
      return 1;
    }
  }
};

// dist/pi/local-conversation-ops.js
import { join as join19 } from "node:path";

// dist/pi/local-agent.js
import { spawn as spawn3 } from "node:child_process";
import { existsSync as existsSync13, mkdirSync as mkdirSync4, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join17 } from "node:path";
import readline from "node:readline";
var NON_AGENT_TYPES = /* @__PURE__ */ new Set(["response", "extension_ui_request"]);
function harvestWorkspace(tools) {
  const ws = emptyWorkspaceSurface();
  const add = (arr, p) => {
    if (typeof p === "string" && p && !arr.includes(p))
      arr.push(p);
  };
  for (const t of tools) {
    if (t.isError)
      continue;
    const path = t.args.path;
    switch (t.name) {
      case "is_write":
        add(ws.modified, path);
        break;
      case "is_commit":
        if (Array.isArray(t.args.paths))
          for (const p of t.args.paths)
            add(ws.modified, p);
        else
          add(ws.modified, path);
        break;
      case "is_navigate":
      case "read":
        add(ws.read, path);
        break;
      default:
        break;
    }
  }
  return ws;
}
function lastPosition(tools) {
  for (let i = tools.length - 1; i >= 0; i--) {
    if (tools[i].name === "is_navigate" && !tools[i].isError) {
      const p = tools[i].args.path;
      if (typeof p === "string")
        return p;
    }
  }
  return "";
}
var PI_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
function isValidPiThinkingLevel(level) {
  return PI_THINKING_LEVELS.includes(level);
}
function deriveConversationName(message) {
  const line = message.split("\n").find((l) => l.trim()) ?? message;
  const clean = line.replace(/\s+/g, " ").trim();
  if (!clean)
    return "Untitled";
  return clean.length > 60 ? `${clean.slice(0, 57)}\u2026` : clean;
}
function ensureSessionDir(dir) {
  mkdirSync4(dir, { recursive: true });
  const ignore = join17(dir, ".gitignore");
  if (!existsSync13(ignore))
    writeFileSync4(ignore, "*\n");
}
function buildPiArgs(opts) {
  const args2 = [
    "--mode",
    "rpc",
    "--session-id",
    opts.conversationId,
    "--session-dir",
    opts.sessionDir,
    "-a"
  ];
  if (opts.extensionPaths.length)
    args2.push("--no-extensions");
  for (const ext of opts.extensionPaths)
    args2.push("--extension", ext);
  for (const skill of opts.skillPaths ?? [])
    args2.push("--skill", skill);
  if (opts.piModel)
    args2.push("--model", opts.piModel);
  if (opts.thinkingLevel)
    args2.push("--thinking", opts.thinkingLevel);
  return args2;
}
async function* runLocalTurn(opts) {
  const modelTier = opts.modelTier ?? "local";
  let turnTools = [];
  const translator = new KeeperTranslator({
    conversationId: opts.conversationId,
    modelTier,
    harvestWorkspace: (tools) => {
      turnTools = tools;
      return harvestWorkspace(tools);
    }
  });
  ensureSessionDir(opts.sessionDir);
  const args2 = buildPiArgs(opts);
  const pi = spawn3(opts.piBin ?? "pi", args2, { cwd: opts.repoPath, stdio: ["pipe", "pipe", "pipe"] });
  let stderr = "";
  pi.stderr.on("data", (d) => {
    stderr += String(d);
  });
  let aborted = false;
  const onAbort = () => {
    aborted = true;
    try {
      pi.kill("SIGTERM");
    } catch {
    }
  };
  if (opts.signal) {
    if (opts.signal.aborted)
      onAbort();
    else
      opts.signal.addEventListener("abort", onAbort, { once: true });
  }
  let sessionName;
  const send2 = (obj) => {
    try {
      pi.stdin.write(`${JSON.stringify(obj)}
`);
    } catch {
    }
  };
  send2({ type: "get_state", id: "__state" });
  send2({ type: "prompt", message: opts.message, id: "p1" });
  const rl = readline.createInterface({ input: pi.stdout, terminal: false });
  try {
    for await (const line of rl) {
      const text = line.trim();
      if (!text)
        continue;
      let msg;
      try {
        msg = JSON.parse(text);
      } catch {
        continue;
      }
      const type = typeof msg.type === "string" ? msg.type : "";
      if (NON_AGENT_TYPES.has(type)) {
        if (type === "response" && msg.command === "get_state" && msg.success !== false) {
          const data = msg.data;
          sessionName = data?.sessionName;
        }
        if (type === "response" && msg.success === false && msg.command === "prompt") {
          yield translator.error("pi_error", String(msg.error ?? "prompt failed"));
          return;
        }
        continue;
      }
      for (const ke of translator.translate(msg)) {
        if (ke.type === "turn_complete")
          ke.result.position = lastPosition(turnTools);
        yield ke;
      }
      if (type === "agent_end") {
        if (!sessionName || !sessionName.trim()) {
          send2({ type: "set_session_name", name: deriveConversationName(opts.message), id: "__name" });
          await new Promise((r) => setTimeout(r, 250));
        }
        return;
      }
    }
    if (aborted && !translator.isEnded) {
      yield translator.cancelled("aborted");
    } else if (!translator.isEnded) {
      yield translator.error("pi_exit", stderr.trim() || "pi ended without completing the turn");
    }
  } finally {
    opts.signal?.removeEventListener("abort", onAbort);
    rl.close();
    try {
      pi.stdin.end();
    } catch {
    }
    pi.kill("SIGTERM");
  }
}

// dist/pi/local-conversations.js
import { existsSync as existsSync14, readdirSync as readdirSync2, readFileSync as readFileSync6, statSync as statSync5 } from "node:fs";
import { randomUUID } from "node:crypto";
import { join as join18 } from "node:path";
function localSessionDir(contextRoot) {
  return join18(contextRoot, ".pi", "sessions");
}
function mintConversationId() {
  return `local-${randomUUID()}`;
}
function textOf(content) {
  if (typeof content === "string")
    return content;
  if (!Array.isArray(content))
    return "";
  return content.filter((c) => c && typeof c === "object" && c.type === "text").map((c) => String(c.text ?? "")).join("");
}
function parseSessionJsonl(text, fallbackTs) {
  let id = "";
  let name = null;
  const messages = [];
  let preview = "";
  let count = 0;
  let lastTs = fallbackTs;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed)
      continue;
    let e;
    try {
      e = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (e.type === "session") {
      if (typeof e.id === "string")
        id = e.id;
    } else if (e.type === "session_info") {
      if (typeof e.name === "string" && e.name.trim())
        name = e.name;
    } else if (e.type === "message" && e.message && typeof e.message === "object") {
      const m = e.message;
      const created = typeof e.timestamp === "string" ? e.timestamp : void 0;
      if (created)
        lastTs = created;
      const role = m.role;
      if (role === "user") {
        const content = textOf(m.content);
        messages.push({ role: "user", content, created_at: created });
        if (!preview)
          preview = content.replace(/\s+/g, " ").trim().slice(0, 120);
        count += 1;
      } else if (role === "assistant") {
        const parts = Array.isArray(m.content) ? m.content : [];
        const toolCalls = parts.filter((c) => c.type === "toolCall").map((c) => ({
          id: String(c.id ?? ""),
          name: String(c.name ?? ""),
          args: c.arguments ?? {}
        }));
        messages.push({
          role: "assistant",
          content: textOf(m.content),
          created_at: created,
          ...toolCalls.length ? { tool_calls: toolCalls } : {},
          ...m.usage ? { usage: m.usage } : {}
        });
        count += 1;
      } else if (role === "toolResult") {
        messages.push({
          role: "tool",
          content: textOf(m.content),
          tool_call_id: typeof m.toolCallId === "string" ? m.toolCallId : void 0,
          tool_name: typeof m.toolName === "string" ? m.toolName : void 0,
          is_error: Boolean(m.isError),
          created_at: created
        });
      }
    }
  }
  return { id, name, messages, messageCount: count, preview, updatedAt: lastTs };
}
function findSessionFile(dir, convId) {
  if (!existsSync14(dir))
    return null;
  const files = readdirSync2(dir).filter((f) => f.endsWith(".jsonl"));
  const bySuffix = files.find((f) => f.endsWith(`_${convId}.jsonl`));
  if (bySuffix)
    return join18(dir, bySuffix);
  for (const f of files) {
    try {
      const first = readFileSync6(join18(dir, f), "utf8").split("\n", 1)[0];
      if (JSON.parse(first).id === convId)
        return join18(dir, f);
    } catch {
    }
  }
  return null;
}
function getLocalConversation(contextRoot, convId) {
  const file = findSessionFile(localSessionDir(contextRoot), convId);
  if (!file) {
    return { conversation_id: convId, repo_id: contextRoot, name: "", history: [], active_turn: null };
  }
  const mtime = statSync5(file).mtime.toISOString();
  const s = parseSessionJsonl(readFileSync6(file, "utf8"), mtime);
  return {
    conversation_id: convId,
    repo_id: contextRoot,
    name: s.name ?? s.preview ?? "Untitled",
    history: s.messages,
    active_turn: null,
    turn_count: s.messageCount,
    updated_at: s.updatedAt
  };
}
function listLocalConversations(contextRoot) {
  const dir = localSessionDir(contextRoot);
  if (!existsSync14(dir))
    return { conversations: [], total: 0 };
  const summaries = [];
  for (const f of readdirSync2(dir).filter((f2) => f2.endsWith(".jsonl"))) {
    const path = join18(dir, f);
    let text;
    try {
      text = readFileSync6(path, "utf8");
    } catch {
      continue;
    }
    const mtime = statSync5(path).mtime.toISOString();
    const s = parseSessionJsonl(text, mtime);
    if (!s.id)
      continue;
    summaries.push({
      conversation_id: s.id,
      name: s.name ?? s.preview ?? "Untitled",
      summary: s.preview,
      message_count: s.messageCount,
      status: "idle",
      updated_at: s.updatedAt
    });
  }
  summaries.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return { conversations: summaries, total: summaries.length };
}

// dist/pi/local-conversation-ops.js
function parseCommaList(flag, envFallback) {
  const raw = typeof flag === "string" ? flag : envFallback;
  return (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
function reportLocalError(err, output) {
  output.error(err instanceof Error ? err.message : String(err));
  return 1;
}
async function send(flags2, output) {
  const message = typeof flags2.message === "string" ? flags2.message : void 0;
  if (!message) {
    output.error("A message is required: --message <text>");
    return 1;
  }
  const extensionPaths = parseCommaList(flags2.ext, process.env.IDEASPACES_PI_EXTENSIONS);
  if (!extensionPaths.length) {
    output.error("Extensions are required: --ext <pi-is-space,pi-local-context> (or set IDEASPACES_PI_EXTENSIONS)");
    return 1;
  }
  const skillPaths = parseCommaList(flags2.skill, process.env.IDEASPACES_PI_SKILLS);
  const repoPath = typeof flags2.context === "string" ? flags2.context : process.cwd();
  const sessionDir = typeof flags2["session-dir"] === "string" ? flags2["session-dir"] : join19(repoPath, ".pi", "sessions");
  const conversationId = typeof flags2.conversation === "string" ? flags2.conversation : `local-${Date.now().toString(36)}`;
  const modelTier = typeof flags2["model-tier"] === "string" ? flags2["model-tier"] : "local";
  const piModel = typeof flags2["pi-model"] === "string" ? flags2["pi-model"] : void 0;
  const piThinking = typeof flags2["pi-thinking"] === "string" ? flags2["pi-thinking"] : void 0;
  if (piThinking !== void 0 && !isValidPiThinkingLevel(piThinking)) {
    output.error(`Invalid thinking level "${piThinking}". Valid values: ${PI_THINKING_LEVELS.join(", ")}`);
    return 1;
  }
  const piBin = typeof flags2["pi-bin"] === "string" ? flags2["pi-bin"] : void 0;
  const controller = new AbortController();
  let signalled = false;
  const onSignal = () => {
    if (signalled)
      return;
    signalled = true;
    controller.abort();
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  try {
    for await (const event of runLocalTurn({
      repoPath,
      message,
      extensionPaths,
      skillPaths,
      conversationId,
      sessionDir,
      modelTier,
      piModel,
      thinkingLevel: piThinking,
      piBin,
      signal: controller.signal
    })) {
      process.stdout.write(`${JSON.stringify(event)}
`);
    }
    return 0;
  } catch (err) {
    return reportLocalError(err, output);
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}
function createNew(output) {
  const id = mintConversationId();
  output.result({ conversation_id: id }, `Created local conversation ${id}`);
  return 0;
}
function get(flags2, output) {
  const convId = typeof flags2.conversation === "string" ? flags2.conversation : void 0;
  if (!convId) {
    output.error("A conversation id is required: --conversation <id>");
    return 1;
  }
  const contextRoot = typeof flags2.context === "string" ? flags2.context : process.cwd();
  const detail = getLocalConversation(contextRoot, convId);
  output.result(detail, detail.history.length ? detail.history.map((m) => {
    const preview = m.content.replace(/\s+/g, " ");
    return `${m.role}: ${preview.length > 80 ? `${preview.slice(0, 79)}\u2026` : preview}`;
  }).join("\n") : "No messages yet.");
  return 0;
}
function list(flags2, output) {
  const contextRoot = typeof flags2.context === "string" ? flags2.context : process.cwd();
  const { conversations, total } = listLocalConversations(contextRoot);
  output.result({ context: contextRoot, conversations, total, has_more: false }, conversations.length ? conversations.map((c) => `${c.name || "(untitled)"} \u2014 ${c.message_count} message${c.message_count === 1 ? "" : "s"}`).join("\n") : "No local conversations.");
  return 0;
}
var localConversationOps = { send, createNew, get, list };

// dist/router.js
var conversationCommand = makeConversationCommand(localConversationOps);
var conversationsCommand = makeConversationsCommand(localConversationOps);
var topLevel = [
  createCommand,
  loginCommand,
  whoamiCommand,
  reposCommand,
  catalogCommand,
  piStatusCommand,
  piModelsCommand,
  piLoginCommand,
  piLogoutCommand,
  cloneCommand,
  clonesCommand,
  linkCommand,
  forgetCommand,
  conversationsCommand,
  conversationCommand,
  agentsCommand,
  nodeCommand,
  searchCommand,
  lsCommand,
  publishCommand,
  writeCommand,
  commitCommand,
  changeCommand,
  navigateCommand,
  statusCommand,
  timesCommand,
  shareCommand,
  pullCommand,
  pushCommand,
  syncCommand,
  skillsCommand,
  credentialCommand
];
var power = [
  logoutCommand
];
function findCommand_(name) {
  return topLevel.find((c) => c.name === name) ?? power.find((c) => c.name === name);
}
function printHelp() {
  const lines = [
    "Usage: ideaspaces <command> [options]",
    "",
    "Commands:"
  ];
  for (const cmd2 of topLevel) {
    lines.push(`  ${cmd2.name.padEnd(14)} ${cmd2.description}`);
  }
  lines.push("", "  power          Advanced tools (logout, ...)");
  lines.push("", "Global flags:");
  lines.push("  --json         Structured JSON output to stdout");
  lines.push("  --quiet        Suppress non-essential output");
  lines.push("  --yes          Skip confirmation prompts");
  lines.push("  --help         Show help");
  lines.push("", "Run: ideaspaces <command> --help for command-specific help.");
  process.stderr.write(lines.join("\n") + "\n");
}
function printPowerHelp() {
  const lines = [
    "Usage: ideaspaces power <command> [options]",
    "",
    "Power tools:"
  ];
  for (const cmd2 of power) {
    lines.push(`  ${cmd2.name.padEnd(14)} ${cmd2.description}`);
  }
  lines.push("", "Run: ideaspaces power <command> --help for details.");
  process.stderr.write(lines.join("\n") + "\n");
}

// dist/errors.js
function handleError(err, output) {
  if (err instanceof Error) {
    if (err.message.includes("Not logged in")) {
      output.error(`Error: ${err.message}
Run: ideaspaces login`);
      return 2;
    }
    output.error(`Error: ${err.message}`);
    return 1;
  }
  output.error(`Error: ${String(err)}`);
  return 1;
}

// dist/main.js
function installSyncWriter(stream, fd) {
  stream.write = ((chunk, ...rest) => {
    const buf = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : Buffer.from(chunk);
    let offset = 0;
    while (offset < buf.length) {
      try {
        offset += writeSync(fd, buf, offset, buf.length - offset);
      } catch (err) {
        if (err.code === "EAGAIN")
          continue;
        throw err;
      }
    }
    const cb = rest.find((a) => typeof a === "function");
    cb?.();
    return true;
  });
}
installSyncWriter(process.stdout, 1);
installSyncWriter(process.stderr, 2);
var { global, command, args, flags } = parseArgs(process.argv.slice(2));
if (!command || global.help && !command) {
  printHelp();
  process.exit(0);
}
var resolvedCommand = command;
var resolvedArgs = args;
if (command === "power") {
  if (global.help || !args[0]) {
    printPowerHelp();
    process.exit(0);
  }
  resolvedCommand = args[0];
  resolvedArgs = args.slice(1);
}
var cmd = findCommand_(resolvedCommand);
if (!cmd) {
  process.stderr.write(`Unknown command: ${resolvedCommand}
Run: ideaspaces --help
`);
  process.exit(1);
}
if (global.help) {
  const lines = [`Usage: ${cmd.usage}`, "", cmd.description];
  if (cmd.examples?.length) {
    lines.push("", "Examples:");
    for (const ex of cmd.examples)
      lines.push(`  ${ex}`);
  }
  process.stderr.write(lines.join("\n") + "\n");
  process.exit(0);
}
try {
  const exitCode = await cmd.run(resolvedArgs, flags, global);
  process.exit(exitCode);
} catch (err) {
  const output = createOutput(global);
  const exitCode = handleError(err, output);
  process.exit(exitCode);
}
