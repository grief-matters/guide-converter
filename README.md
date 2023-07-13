# Conversion Script

Script to convert the Guide from a Word docx file to JSON data.

Data files are expected in Markdown format and should be placed in `./data` prior to execution.

Run `npm start -- --test-data` to produce test output and test Markdown parsing/resource extraction.

# Regex Cheat Sheet

general find for markdown links is: `\[(.*?)\]\((.*?)\)`

Remove links following `(from`
find: `\(from \[([^\]]+)\]\((.*?)\)`
replace: `(from $1`

To remove empty line after title find with:
Find: `(\[.*\]\([^)]+\))\n\n`
Replace: `$1\n`

Remove new lines in markdown link titles:
Find: `(\[.*?)[\r\n]+\s*(.*?\])`
Replace: `$1 $2`

Find new lines within markdown link title:
find: `(\[[^\n\]]*)\n([^\[\]]*\])`
replace:

Insert a new line after markdown links that do not have one:
Find: `\[[^\]]+\]\([^)]+\)(?!\n)`
Replace: `$0\n`

Find short lines with no other text following them:
`^.{1,9}$\n^\s*$`

Find lines on their own:
find: `(\n\n)(?<!\[[^\]]*\])^(?!.*\[[^\]]*\]\(.*\))(.*?)(?=\n\n)`
replace: `\n$2`

Separate consecutive markdown links with empty line:
find: `(\[[^\]]+\]\([^)]+\))\r?\n(\[[^\]]+\]\([^)]+\))`
replace: `$1\n\n$2`

Move text that precedes a link to follow it:
find: `(.+?)\[(.+?)\]\((.+?)\)`
replace: `[$2]($3) $1`

Find and convert links that appear in Source:
find: `\(\s*from\s*\n\n\[\s*(.*?)\]\s*\(\s*(.*?)\s*\)\s*\)`
replace: `(from $1)`

Find links that appear immediately before `)` i.e. in source:
find: `\[([^\[\]]+)\]\(([^()]+)\)\)`
replace: `$1)`

Find new lines in source:
find: `\(from\n\n(.*?)\)`
replace: `(from $1)`

Find markdown links with erroneous char at end e.g. `;`:
find: `\[(.*?)\]\((.*?)\);`
replace: `[$1]($2)`

Break up side by side links across lines:
find: `\)\[`
replace: `)\n[`
