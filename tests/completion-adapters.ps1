$ErrorActionPreference = 'Stop'
$script:completionBlock = $null
# Capture registration in this disposable test process; execute the real adapter.
function Register-ArgumentCompleter {
    param([switch]$Native, [string]$CommandName, [scriptblock]$ScriptBlock)
    $script:completionBlock = $ScriptBlock
}
. (Join-Path $PSScriptRoot '../assets/completions/args.ps1')
function Invoke-ArgsCompletionProbe {
    if ($args.Count -ne 4 -or $args[0] -ne '--args-complete' -or $args[2] -ne '42') {
        throw 'Adapter did not preserve numeric literal arguments'
    }
    $global:LASTEXITCODE = 0
    'space value'
    "single'quote"
}
Register-FidanArgsCompletion -CommandName Invoke-ArgsCompletionProbe
$inputText = 'Invoke-ArgsCompletionProbe --count 42 --na'
$tokens = $null
$parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseInput($inputText, [ref]$tokens, [ref]$parseErrors)
$command = $ast.EndBlock.Statements[0].PipelineElements[0]
$result = @(& $script:completionBlock '--na' $command $inputText.Length)
if ($result.Count -ne 2) { throw 'Numeric literal must not disable completion' }
if ($result[0].CompletionText -cne "'space value'" -or $result[1].CompletionText -cne "'single''quote'") {
    throw 'Completion candidates must be quoted literals'
}
$inputText = 'Invoke-ArgsCompletionProbe --count $nonliteral --na'
$ast = [Management.Automation.Language.Parser]::ParseInput($inputText, [ref]$tokens, [ref]$parseErrors)
$result = @(& $script:completionBlock '--na' $ast.EndBlock.Statements[0].PipelineElements[0] $inputText.Length)
if ($result.Count -ne 0) { throw 'Completion must not evaluate nonliteral expressions' }
'PowerShell completion adapter checks passed'
