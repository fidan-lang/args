# source args.fish; complete -c mytool -f -a '(fidan_args_complete mytool)'
function fidan_args_complete
    set -l previous (commandline -opc)
    set -l current (commandline -ct)
    $argv[1] --args-complete $previous[2..-1] "$current" | while read -l candidate
        string escape -- "$candidate"
    end
end
