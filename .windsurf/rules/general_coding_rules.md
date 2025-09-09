---
trigger: always_on
---

# General coding rules to follow when developing.

- DO NOT write custom .d.ts files for missing types. Ask for the human developer to help you fix any missing typing.

- DO look up the latest version number of all packages that are installed. DO NOT install old, out-dated, or incorrect version numbers

- DO install packages in the correct package folder. This is a mono-repo with /packages/app for expo react native code and /packages/api for convex backend code