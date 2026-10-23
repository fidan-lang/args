# . ./args.ps1; Register-FidanArgsCompletion -CommandName mytool
function Register-FidanArgsCompletion {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CommandName)
    $completion = {
        param($wordToComplete, $commandAst, $cursorPosition)
        $tokens = [System.Collections.Generic.List[string]]::new()
        $elements = @($commandAst.CommandElements | Select-Object -Skip 1)
        foreach ($element in $elements) {
            if ($element.Extent.StartOffset -ge $cursorPosition) { break }
            # Reading literal AST values does not evaluate PowerShell expressions.
            if ($element -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
                $tokens.Add($element.Value)
            } elseif ($element -is [System.Management.Automation.Language.ConstantExpressionAst]) {
                # Numeric literals are passed as written, without evaluation or culture conversion.
                $tokens.Add($element.Extent.Text)
            } else { return }
        }
        if ($elements.Count -eq 0 -or $elements[-1].Extent.EndOffset -lt $cursorPosition) { $tokens.Add('') }
        foreach ($candidate in @(& $CommandName --args-complete @tokens)) {
            if ($LASTEXITCODE -ne 0) { return }
            # Quote completion text as a PowerShell literal, never execute it.
            $literal = "'" + $candidate.Replace("'", "''") + "'"
            [System.Management.Automation.CompletionResult]::new($literal, $candidate, 'ParameterValue', $candidate)
        }
    }.GetNewClosure()
    Register-ArgumentCompleter -Native -CommandName $CommandName -ScriptBlock $completion
}
