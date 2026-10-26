#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source assets/completions/args.bash
_args_completion_probe() {
    [[ "$#" == 3 && "$1" == --args-complete && "$2" == --name && "$3" == prefix ]] || return 2
    printf '%s\n' 'space value' 'literal$marker' "single'quote"
}
COMP_WORDS=(_args_completion_probe --name prefix ignored-after-cursor)
COMP_CWORD=2
_fidan_args_complete
[[ "${#COMPREPLY[@]}" == 3 ]] || { echo 'completion cursor arguments lost' >&2; exit 1; }
expected=('space value' 'literal$marker' "single'quote")
for index in 0 1 2; do
    printf -v quoted '%q' "${expected[index]}"
    [[ "${COMPREPLY[index]}" == "$quoted" ]] || { echo 'completion must be shell-quoted' >&2; exit 1; }
done
echo 'Bash completion adapter checks passed'
