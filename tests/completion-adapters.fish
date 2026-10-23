#!/usr/bin/env fish
source assets/completions/args.fish
function commandline
    switch $argv[1]
        case -opc
            printf '%s\n' completion_probe --count 42
        case -ct
            printf '%s\n' --na
        case '*'
            return 2
    end
end
function completion_probe
    if test (count $argv) -ne 4; or test "$argv[1]" != --args-complete; or test "$argv[3]" != 42; or test "$argv[4]" != --na
        return 2
    end
    printf '%s\n' 'space value' 'literal$marker'
end
set -l actual (fidan_args_complete completion_probe)
set -l expected (string escape -- 'space value' 'literal$marker')
if test (count $actual) -ne 2; or test "$actual[1]" != "$expected[1]"; or test "$actual[2]" != "$expected[2]"
    echo 'Fish adapter token/escaping regression' >&2
    exit 1
end
echo 'Fish completion adapter checks passed'
