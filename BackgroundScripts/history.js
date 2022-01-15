function addHistory(name, episode, id) {
    getHistoryVariable(function (historyObj) {
        historyObj.push({
            name: name,
            episode: episode,
            time: Date.now(),
            id: id
        });
        setHistoryVariable(historyObj);
    });
}