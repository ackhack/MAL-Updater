chrome.runtime.onMessage.addListener(
    //Listener for HTTPReqeust
    //Needed because content_scripts cant run them
    function (request, sender, onSuccess) {
        switch (request.type) {
            case "GET_ANIME":
                return getAnime(request, onSuccess);
            case "SEND_USERTOKEN":
                return checkState(request, onSuccess);
            case "SEND_ANIME_FINISHED":
                return finishedEpisode(request, onSuccess);
            case "CLOSE_TAB":
                return closeTab(sender,request.force);
            case "CACHE_ANIME":
                return setCache(request, onSuccess);
            case "VALIDATE_SITE":
                return validateSite(request, onSuccess);
            case "VALIDATE_MAIN_SITE":
                return validateMainSite(request, onSuccess);
            case "CHANGED_BOOKMARK":
                return updateBookmarkFolder(request);
            case "DELETE_CACHE":
                return deleteCache(request.query, onSuccess);
            case "CHANGED_ACTIVE":
                return changeActiveState(request.value);
            case "UNAUTHORIZE":
                return unauthorize();
            case "CHANGED_CHECK_LAST_EPISODE":
                return changeCheckLastEpisode(request.value);
            case "CHANGED_DISPLAY_MODE":
                return changeDisplayMode(request.value);
            case "BINGE_WATCHING":
                return addBinge(request.id);
            case "GET_NEWEST_VERSION":
                return checkUpdate(onSuccess);
            case "SYNC_CACHE":
                return initCache(onSuccess);
            case "SYNC_HISTORY":
                return initHistory(onSuccess);
            case "SITE_OPENED":
                return selectInjector(sender);
            case "ANIME_WATCHED_INFO":
                return handleAnimeWatchedInfo(request);
            case "GET_ANIME_BY_ID":
                return getAnimeDetails(request.id, onSuccess);
            case "GET_ANIME_BY_URL":
                return getCacheByURLAsync(request.url, onSuccess);
            case "EXPORT_CACHE":
                return exportCacheCallb(onSuccess);
            case "IMPORT_CACHE":
                return importCacheFile(request);
            case "CONFIRM_MESSAGE":
                return confirmMessage(request.message,onSuccess);
            case "GET_SITES":
                return getSitesAsync(onSuccess);
            case "CHANGED_PREFERRED_SITE":
                return changePreferredSite(request);
            case "GET_PREFERRED_SITE":
                return getPreferredSite(onSuccess);
            case "CHANGED_BOOKMARK_AUTO_ACTIVE":
                return changeBookmarkAutoActive(request);
            case "AUTO_BOOKMARK_CHECK":
                return checkBookmarkAuto(request);
            default:
                return false;
        }
    }
);