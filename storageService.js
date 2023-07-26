const { storageFunction } = require("storage-function");

module.exports.storageService = {
    toLocalStorage: (key, value) => {
        storageFunction.toLocalStorage(key, value);
    },
    fromLocalStorage: (key) => {
        return storageFunction.fromLocalStorage(key);
    },
    removeFromLocalStorage: (key) => {
        storageFunction.removeFromLocalStorage(key);
    },
};
