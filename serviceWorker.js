self.importScripts(
    "GenericScripts/variableHandler.js",
    "GenericScripts/genericFuntions.js",
    "BackgroundScripts/anime.js",
    "BackgroundScripts/auth.js",
    "BackgroundScripts/bookmarks.js",
    "BackgroundScripts/cache.js",
    "BackgroundScripts/history.js",
    "BackgroundScripts/runtime_func.js",
    "BackgroundScripts/injectSelector.js",
    "BackgroundScripts/discordRichPresence.js",
    "BackgroundScripts/init.js",
    "BackgroundScripts/alarmHandler.js"
);

chrome.runtime.onMessage.addListener(
    //Listener for HTTPReqeust
    //Needed because content_scripts cant run them

    function (request, sender, onSuccess) {

        switch (request.type) {
            case "GET_ANIME":
                getAnime(request, onSuccess);
                break;
            case "SEND_USERTOKEN":
                checkState(request, onSuccess);
                break;
            case "SEND_ANIME_FINISHED":
                finishedEpisode(request, onSuccess);
                break;
            case "CLOSE_TAB":
                closeTab(sender, request.force);
                break;
            case "CACHE_ANIME":
                loadIntoCache(request, onSuccess);
                break;
            case "VALIDATE_SITE":
                validateSite(request, onSuccess);
                break;
            case "VALIDATE_MAIN_SITE":
                validateMainSite(request, onSuccess);
                break;
            case "CHANGED_BOOKMARK":
                updateBookmarkFolder(request);
                break;
            case "DELETE_CACHE":
                deleteCache(request.query, onSuccess);
                break;
            case "CHANGED_ACTIVE":
                changeActiveState(request.value);
                break;
            case "UNAUTHORIZE":
                unauthorize();
                break;
            case "GET_NEWEST_VERSION":
                checkUpdate(onSuccess);
                break;
            case "SITE_OPENED":
                selectInjector(sender);
                break;
            case "ANIME_WATCHED_INFO":
                handleAnimeWatchedInfo(request);
                break;
            case "GET_ANIME_BY_ID":
                getAnimeDetails(request.id, onSuccess);
                break;
            case "EXPORT_CACHE":
                exportCache(onSuccess);
                break;
            case "IMPORT_CACHE":
                importCacheFile(request);
                break;
            case "CONFIRM_MESSAGE":
                confirmMessage(request.message, onSuccess);
                break;
            case "GET_SITES":
                getSitesVariable(onSuccess);
                break;
            case "GET_PREFERRED_SITE":
                getPreferredSiteNameVariable(onSuccess);
                break;
            case "AUTO_BOOKMARK_CHECK":
                checkBookmarkAuto(request);
                break;
            case "GET_ACTIVE_ANIME":
                getActiveAnime(onSuccess);
                break;
            case "DELETE_ACTIVE_CACHE":
                deleteActiveCache(onSuccess);
                break;
            case "GET_BOOKMARK_FOLDER_NAME":
                getBookmarkFolderName(onSuccess);
                break;
            case "CHANGE_BOOKMARKS":
                updateBookmarkFolder(request)
                break;
            case "CHANGED_ACTIVE_DISCORD":
                changeActiveDiscordState(request.value);
                break;
            case "REMOVE_DRP":
                removeDiscord();
                break;
            case "DISCORD_PRESENCE":
                handleDiscordPresence(request);
                break;
            default:
                return false;
        }
        return true;
    }
);

chrome.runtime.onStartup.addListener(() => {
    startAlarms();
})

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    switch (sender.url) {
        case "https://discord.com/channels/@me":
            handleDiscordExternal(request, sender, sendResponse);
            break;
    }
    return true;
});