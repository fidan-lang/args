# source args.zsh; compdef _fidan_args_complete mytool
_fidan_args_complete() {
    local -a candidates
    candidates=("${(@f)$("$words[1]" --args-complete "${(@)words[2,CURRENT]}")}")
    compadd -- "${candidates[@]}"
}
