// DazScript PEG Grammar

{
  // Helper to build left-associative binary expressions
  function buildBinaryExpr(head, tail) {
    return tail.reduce((left, [, op, , right]) => ({
      type: "BinaryExpression", op, left, right
    }), head);
  }
}

Program
  = _n body:Statement* _n { return { type: "Program", body }; }

Statement
  = FunctionDeclaration
  / VariableDeclaration
  / ReturnStatement
  / IfStatement
  / UnlessStatement
  / ExpressionStatement

VariableDeclaration
  = kind:("let" / "const") __ name:Identifier _ "=" _ init:Expression EOS
    { return { type: "VariableDeclaration", kind, name: name.name, init }; }
  / name:Identifier _ "=" _ init:Expression EOS
    { return { type: "VariableDeclaration", kind: "const", name: name.name, init }; }

FunctionDeclaration
  // Math-style: squared(x) = x * x
  = name:Identifier _ "(" _ params:ParamList? _ ")" _ "=" _ body:Block _n
    { return { type: "FunctionDeclaration", name: name.name, params: params || [], body }; }
  / name:Identifier _ "(" _ params:ParamList? _ ")" _ "=" _ expr:Expression EOS
    { return { type: "FunctionDeclaration", name: name.name, params: params || [], body: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } }; }
  // Arrow-style with parens: squared: (x) -> x * x
  / name:Identifier _ ":" _ "(" _ params:ParamList? _ ")" _ "->" _ body:Block _n
    { return { type: "FunctionDeclaration", name: name.name, params: params || [], body }; }
  / name:Identifier _ ":" _ "(" _ params:ParamList? _ ")" _ "->" _ expr:Expression EOS
    { return { type: "FunctionDeclaration", name: name.name, params: params || [], body: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } }; }
  // Arrow-style: squared: x -> x * x
  / name:Identifier _ ":" _ params:ParamList _ "->" _ body:Block _n
    { return { type: "FunctionDeclaration", name: name.name, params, body }; }
  / name:Identifier _ ":" _ params:ParamList _ "->" _ expr:Expression EOS
    { return { type: "FunctionDeclaration", name: name.name, params, body: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } }; }
  // Pattern-matching style: factorial 0 = 1 (must have at least one non-identifier pattern)
  / name:Identifier patterns:PatternList _ "=" _ body:Block _n
    &{ return patterns.some(p => p.type !== "IdentifierPattern"); } {
      return { type: "PatternFunctionClause", name: name.name, patterns, body };
    }
  / name:Identifier patterns:PatternList _ "=" _ expr:Expression EOS
    &{ return patterns.some(p => p.type !== "IdentifierPattern"); } {
      return { type: "PatternFunctionClause", name: name.name, patterns,
               body: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } };
    }
  // Haskell-style: squared x = x * x
  / name:Identifier params:ParamList _ "=" _ body:Block _n
    { return { type: "FunctionDeclaration", name: name.name, params, body }; }
  / name:Identifier params:ParamList _ "=" _ expr:Expression EOS
    { return { type: "FunctionDeclaration", name: name.name, params, body: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } }; }

ParamList
  = head:Identifier tail:(_ "," _ Identifier)* {
      return [head.name, ...tail.map(t => t[3].name)];
    }

// Pattern matching for function clauses
Pattern
  = LiteralPattern / WildcardPattern / IdentifierPattern

LiteralPattern
  = lit:(NumericLiteral / StringLiteral / BooleanLiteral / NilLiteral) {
      return { type: "LiteralPattern", value: lit };
    }

WildcardPattern
  = "_" !IdentChar _ { return { type: "WildcardPattern" }; }

IdentifierPattern
  = !Reserved name:$([a-zA-Z_] [a-zA-Z0-9_]*) _ {
      return { type: "IdentifierPattern", name };
    }

PatternList
  = head:Pattern tail:(_ "," _ Pattern)* {
      return [head, ...tail.map(t => t[3])];
    }

ReturnStatement
  = "return" __ value:Expression EOS
    { return { type: "ReturnStatement", value }; }

IfStatement
  // Block-style (with braces) - use lookahead to ensure block follows
  = "if" _ "(" _ test:Expression _ ")" _ &"{" consequent:Block _ alternate:Else? _n
    { return { type: "IfStatement", test, consequent, alternate }; }
  / "if" __ test:Expression _ &"{" consequent:Block _ alternate:Else? _n
    { return { type: "IfStatement", test, consequent, alternate }; }

UnlessStatement
  = "unless" _ "(" _ test:Expression _ ")" _ consequent:Block _n
    { return { type: "UnlessStatement", test, consequent }; }
  / "unless" __ test:Expression _ consequent:Block _n
    { return { type: "UnlessStatement", test, consequent }; }

Else
  = "else" _ stmt:IfStatement { return stmt; }
  / "else" _ block:Block { return block; }

Block
  = "{" _n body:Statement* _n "}" { return { type: "Block", body }; }

ExpressionStatement
  = expr:Expression __ "if" _ "(" _ test:Expression _ ")" EOS {
      return { type: "IfStatement", test, consequent: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] }, alternate: null };
    }
  / expr:Expression __ "if" __ test:Expression EOS {
      return { type: "IfStatement", test, consequent: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] }, alternate: null };
    }
  / expr:Expression __ "unless" _ "(" _ test:Expression _ ")" EOS {
      return { type: "UnlessStatement", test, consequent: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } };
    }
  / expr:Expression __ "unless" __ test:Expression EOS {
      return { type: "UnlessStatement", test, consequent: { type: "Block", body: [{ type: "ExpressionStatement", expression: expr }] } };
    }
  / expr:Expression EOS { return { type: "ExpressionStatement", expression: expr }; }

// Expression precedence: Conditional < Pipe < Comparison < Additive < Multiplicative < Call < Member < Primary

Expression
  = ConditionalExpression

ConditionalExpression
  // With "then" keyword - condition can be any expression
  = "if" _ "(" _ test:Expression _ ")" _ "then" __ consequent:Pipe _ "else" __ alternate:ConditionalExpression
    { return { type: "ConditionalExpression", test, consequent, alternate }; }
  / "if" __ test:Pipe _ "then" __ consequent:Pipe _ "else" __ alternate:ConditionalExpression
    { return { type: "ConditionalExpression", test, consequent, alternate }; }
  // Without "then" - condition must be Comparison to delimit from consequent
  / "if" _ "(" _ test:Expression _ ")" _ consequent:Pipe _ "else" _ alternate:ConditionalExpression
    { return { type: "ConditionalExpression", test, consequent, alternate }; }
  / "if" __ test:Comparison _ consequent:Pipe _ "else" _ alternate:ConditionalExpression
    { return { type: "ConditionalExpression", test, consequent, alternate }; }
  / Pipe

Pipe
  = head:Comparison tail:(_ "|>" _ PipeTarget)* {
      return tail.reduce((left, [, , , right]) => {
        if (right.type === "CallExpression") {
          return { type: "CallExpression", callee: right.callee, args: [left, ...right.args] };
        }
        return { type: "CallExpression", callee: right, args: [left] };
      }, head);
    }

PipeTarget
  = callee:MemberExpression _ "(" _ args:ArgList? _ ")" {
      return { type: "CallExpression", callee, args: args || [] };
    }
  / MemberExpression

Comparison
  = head:Additive tail:(_ ("==" / "!=" / "<=" / ">=" / "<" / ">") _ Additive)*
    { return buildBinaryExpr(head, tail); }

Additive
  = head:Multiplicative tail:(_ ("++" / "+" / "-") _ Multiplicative)*
    { return buildBinaryExpr(head, tail); }

Multiplicative
  = head:Exponentiation tail:(_ ("//" / "*" / "/" / "%") _ Exponentiation)*
    { return buildBinaryExpr(head, tail); }

Exponentiation
  = base:Unary _ "**" _ exp:Exponentiation {
      return { type: "BinaryExpression", op: "**", left: base, right: exp };
    }
  / Unary

Unary
  = "-" _ operand:Unary { return { type: "UnaryExpression", op: "-", operand }; }
  / "+" _ operand:Unary { return { type: "UnaryExpression", op: "+", operand }; }
  / CallExpression

CallExpression
  = SpaceCall
  / ParenCall

// Space-separated call: greet "Daz" or puts greet "Daz"
// Note: uses _ not __ because Identifier already consumes trailing whitespace
// Callee must be identifier-based (not a literal) to prevent "true foo" being parsed as true(foo)
SpaceCall
  = callee:CallableMember _ first:SpaceArg rest:(_ "," _ SpaceArg)* !(_ "=") {
      return { type: "CallExpression", callee, args: [first, ...rest.map(r => r[3])] };
    }

// Member expression that starts with an identifier (callable)
CallableMember
  = head:Identifier tail:(_ "." _ Identifier)* {
      return tail.reduce((object, t) => ({
        type: "MemberExpression", object, property: t[3].name
      }), head);
    }

// Arguments in a space-separated call (can be nested space calls, paren calls, or simple values)
SpaceArg
  = SpaceCall
  / ParenCallChain
  / MemberExpression

// Paren call with at least one set of parens: foo(1) or foo(1)(2)
ParenCallChain
  = callee:MemberExpression args:(_ "(" _ ArgList? _ ")")+ {
      return args.reduce((expr, a) => ({
        type: "CallExpression", callee: expr, args: a[3] || []
      }), callee);
    }

// Standard paren call (fallback, allows zero parens = just returns callee)
ParenCall
  = callee:MemberExpression args:(_ "(" _ ArgList? _ ")")* {
      return args.reduce((expr, a) => ({
        type: "CallExpression", callee: expr, args: a[3] || []
      }), callee);
    }

ArgList
  = head:Expression tail:(_ "," _ Expression)* {
      return [head, ...tail.map(t => t[3])];
    }

MemberExpression
  = head:Primary tail:(_ "." _ Identifier)* {
      return tail.reduce((object, t) => ({
        type: "MemberExpression", object, property: t[3].name
      }), head);
    }

Primary
  = RangeLiteral
  / ArrayLiteral
  / ObjectLiteral
  / NumericLiteral
  / StringLiteral
  / BooleanLiteral
  / NilLiteral
  / SymbolLiteral
  / Identifier
  / "(" _ expr:Expression _ ")" { return expr; }

ObjectLiteral
  = "{" _ "}" { return { type: "ObjectLiteral", properties: [] }; }
  / "{" _n properties:PropertyList _n "}" { return { type: "ObjectLiteral", properties }; }

PropertyList
  = head:Property tail:(_ "," _n Property)* {
      return [head, ...tail.map(t => t[3])];
    }

Property
  = key:PropertyKey _ ":" _ value:Expression { return { key, value, shorthand: false }; }
  / key:PropertyKey _ "=>" _ value:Expression { return { key, value, shorthand: false }; }
  / id:Identifier { return { key: id.name, value: id, shorthand: true }; }

PropertyKey
  = name:$([a-zA-Z_] [a-zA-Z0-9_]*) _ { return name; }
  / str:StringLiteral { return str.value; }

RangeLiteral
  = "[" _ start:Expression _ ".." _ end:Expression _ "]" {
      return { type: "RangeLiteral", start, end };
    }

ArrayLiteral
  = "[" _ "]" { return { type: "ArrayLiteral", elements: [] }; }
  / "[" _ elements:ElementList _ "]" { return { type: "ArrayLiteral", elements }; }

ElementList
  = head:Expression tail:(_ "," _ Expression)* {
      return [head, ...tail.map(t => t[3])];
    }

NumericLiteral
  = digits:$([0-9]+ ("." [0-9]+)?) _ {
      return { type: "NumericLiteral", value: digits };
    }

StringLiteral
  = '"' parts:DoubleStringPart* '"' _ {
      const hasInterpolation = parts.some(p => p.type === "interpolation");
      if (!hasInterpolation) {
        return { type: "StringLiteral", value: parts.map(p => p.value).join('') };
      }
      return { type: "InterpolatedString", parts };
    }
  / "'" chars:$[^']* "'" _ { return { type: "StringLiteral", value: chars }; }

DoubleStringPart
  = '#{' _ expr:Expression _ '}' { return { type: "interpolation", expr }; }
  / chars:DoubleStringChars { return { type: "literal", value: chars }; }

DoubleStringChars
  = chars:DoubleStringChar+ { return chars.join(''); }

DoubleStringChar
  = [^"#\n]
  / '#' !'{' { return '#'; }
  / '\\n' { return '\n'; }
  / '\\t' { return '\t'; }
  / '\\#' { return '#'; }
  / '\\"' { return '"'; }
  / '\\\\' { return '\\'; }
  / '\n' { return '\n'; }

SymbolLiteral
  = ":" name:$([a-zA-Z_] [a-zA-Z0-9_]*) _ {
      return { type: "SymbolLiteral", name };
    }

BooleanLiteral
  = "true" !IdentChar _ { return { type: "BooleanLiteral", value: true }; }
  / "false" !IdentChar _ { return { type: "BooleanLiteral", value: false }; }

NilLiteral
  = ("nil" / "null") !IdentChar _ { return { type: "NilLiteral", value: "null" }; }
  / "undefined" !IdentChar _ { return { type: "NilLiteral", value: "undefined" }; }

Identifier
  = !Reserved name:$([a-zA-Z_] [a-zA-Z0-9_]*) _ {
      return { type: "Identifier", name };
    }

Reserved
  = ("let" / "const" / "function" / "return" / "if" / "else" / "unless" / "then" / "true" / "false" / "nil" / "null" / "undefined" / "_") !IdentChar

IdentChar
  = [a-zA-Z0-9_]

// End of statement: semicolon, newline, end of input, or before closing brace
EOS "end of statement"
  = _ ";" _n
  / _ SingleLineComment? [\n\r] _n
  / _ &"}"
  / _ !.

// Inline whitespace (no newlines)
_ "inline whitespace"
  = [ \t]*

// Mandatory inline whitespace
__ "mandatory inline whitespace"
  = [ \t]+

// Whitespace including newlines
_n "whitespace"
  = ([ \t\r\n] / SingleLineComment)*

SingleLineComment
  = "//" [^\n]*
  / "#" [^\n]*
