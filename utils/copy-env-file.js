const copyEnvFile = (exampleEnvPath, envPath, fs) => {
    return fs.copy(exampleEnvPath, envPath);
};

module.exports = copyEnvFile;
