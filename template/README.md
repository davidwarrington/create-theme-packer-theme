# <%= name %>
---

<%_ if (documentationUrl || repo || supportUrl) { _%>
## Links
<%_ if (store) { _%>
- [Store](<%= store %>)
- [Store Admin](<%= store %>/admin)
<%_ } _%>
<%_ if (documentationUrl) { _%>
- [Documentation](<%= documentationUrl %>)
<%_ } _%>
<%_ if (repo) { _%>
- [Repository](<%= repo %>)
<%_ } _%>
<%_ if (supportUrl) { _%>
- [Support](<%= supportUrl %>)
<%_ } _%>
<%_ } _%>

## Getting Started

```shell
$ <%= runCommand %> build
$ <%= runCommand %> watch
$ <%= runCommand %> deploy
```
