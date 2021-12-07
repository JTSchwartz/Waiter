const fs = require('fs-extra')
const parseArgs = require('minimist')
const serverBuilder = require('restify')

const Parameters = {
    FileShortForm: 'f',
    FileLongForm: 'file',
    GenerateShortForm: 'g',
    GenerateLongForm: 'generate',
}

const argv = parseArgs(process.argv.slice(2));
const arguments = Object.keys(argv)

const executionPath = process.argv[1].replaceAll("\\", "/")
const executionDirectory = executionPath.substr(0, executionPath.lastIndexOf("/"));
let filePath = `${executionDirectory}/resources/waiter.json`

if (arguments.includes(Parameters.GenerateShortForm) || arguments.includes(Parameters.GenerateLongForm)) {
    fs.copySync(filePath, `${process.cwd().replaceAll("\\", "/")}/waiter.json`)
    console.log("Generated waiter.json in current directory")
    return
} else if (arguments.includes(Parameters.FileShortForm) || arguments.includes(Parameters.FileLongForm)) {
    if (arguments.includes(Parameters.FileShortForm)
        && arguments.includes(Parameters.FileLongForm)
        && argv[Parameters.FileShortForm] !== argv[Parameters.FileLongForm]) {
        console.error("Only pass one file")
        return
    }
    filePath = argv[Parameters.FileShortForm] || argv[Parameters.FileLongForm]
}

try {
    const setup = fs.readJsonSync(filePath, 'utf8')["waiter"]
    for (const config of setup) {
        const server = serverBuilder.createServer()
        const response = buildResponseMethod(config.response)

        server.del("/:code", response)
        server.get("/:code", response)
        server.head("/:code", response)
        server.opts("/:code", response)
        server.patch("/:code", response)
        server.post("/:code", response)
        server.put("/:code", response)

        server.listen(config.port, () => {
            console.log(`Server running at ${server.url} will respond with:\n${JSON.stringify(config.response, null, 2)}`)
        })
    }
} catch (e) {
    console.log(e);
}

function buildResponseMethod(response) {
    return function (req, res, next) {
        res.send(response.status, response.body)
        next()
    }
}