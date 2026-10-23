#!/usr/bin/env zsh
set -eu
cd "${0:A:h}/.."
source assets/completions/args.zsh
_args_completion_probe() {
    [[ "$#" == 3 && "$1" == --args-complete && "$2" == --name && "$3" == prefix ]] || return 2
    printf '%s\n' 'space value' 'literal$marker'
}
compadd() {
    [[ "$#" == 3 && "$1" == -- && "$2" == 'space value' && "$3" == 'literal$marker' ]] || return 3
}
words=(_args_completion_probe --name prefix ignored-after-cursor)
CURRENT=3
_fidan_args_complete
print 'Zsh completion adapter checks passed'
