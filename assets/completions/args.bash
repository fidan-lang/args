# source args.bash; complete -F _fidan_args_complete mytool
_fidan_args_complete() {
    local candidate quoted
    COMPREPLY=()
    while IFS= read -r candidate; do
        printf -v quoted '%q' "$candidate"
        COMPREPLY+=("$quoted")
    done < <("${COMP_WORDS[0]}" --args-complete "${COMP_WORDS[@]:1:COMP_CWORD}")
}
