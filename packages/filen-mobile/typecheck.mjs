#!/usr/bin/env node

import ts from "typescript"

const configFilePath = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json")
const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile)

const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, "./", {
	noEmit: true
})

const program = ts.createIncrementalProgram({
	rootNames: compilerOptions.fileNames,
	options: compilerOptions.options
})

const preEmitDiagnostics = ts.getPreEmitDiagnostics(program)
const emitResult = program.emit()
const buildInfoEmitResult = program.emitBuildInfo()

const diagnostics = [...preEmitDiagnostics, ...emitResult.diagnostics, ...buildInfoEmitResult.diagnostics].filter(
	it => !it.file.fileName.includes("node_modules")
)

const errorCount = ts.getErrorCountForSummary(diagnostics)
const filesInError = ts.getFilesInErrorForSummary(diagnostics)
const diagnosticsReporter = ts.createDiagnosticReporter(ts.sys, true)

const reportDiagnostics = diagnostics => {
	for (const diagnostic of diagnostics) {
		diagnosticsReporter(diagnostic)
	}
}

const reportSummary = (errorCount, filesInError) => {
	console.log(ts.getErrorSummaryText(errorCount, filesInError, ts.sys.newLine, ts.sys))
}

reportDiagnostics(diagnostics)
reportSummary(errorCount, filesInError)

process.exit(errorCount === 0 ? 0 : 1)
