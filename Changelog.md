8.3.2: 17.12.2024
    -Migrate Aniwave to Hianime
    -Migrate to new KickAssAnime Link

7.0.1: 27.02.2022
    -Better Discord Implementation

7.0.0: 15.01.2022
    -Updated Manifest Version to 3
    -Confirm Message now moved to Notifications
    -Notification when new Auto Bookmark added
    -Removed DisplayMode
    -Removed checkLastEpisode, now happens always
    -Less Authentification API Calls
    -DRP now muted
    -DRP now in a Tab not iframe
    -Removed Binge Watching
    -Now using Service Worker instead of Background Page
    -Added a Timeline for current Anime Releases
    -Button to visually remove Not Yet Aired from Plan to Watch List
    -Added Global Storage
    -Changed 9anime Pattern
    -Added License
    -Fixed Bugs
    -Newer gogoanimehub urls

6.5.7: 26.10.2021
    -Fixed some Players not skipping on 9anime
    -Fixed DRP not disappearing
    -HistoryViewer now shows limited Amount of Entries

6.5.6: 17.10.2021
    -Added Regex
    -Added Currently watching to Settings

6.5.5: 10.10.2021
    -Fixed Regex

6.5.4: 04.10.2021
    -Removed deprecated initEvent Method
    -Fixed KAA Server Picker

6.5.3: 24.09.2021
    -Cleanup
    -Upkeep Site now closes asap

6.5.2: 28.08.2021
    -Fixed Issues
    -Increased Bookmark Upkeep Time to 30 Mins

6.5.1: 28.08.2021
    -Fixed Error
    -Updated Readme

6.5.0: 28.08.2021
    -Added Help Menu
    -Added Auto Bookmark Upkeep
    -Can't add Bookmark if URL already in a existing Bookmark

6.4.1: 20.08.2021
    -Cache MetaDiv position fixed
    -History MetaDiv position fixed
    -Can now show multiple Sequels

6.4.0: 10.08.2021
    -Unauthorize now requires Confirmation
    -Added Info Window

6.3.0: 27.07.2021
    -Cleanup
    -Can now import/export Cache
    -Fixed Regex Patterns
    -User Inputted ID Checker
    -History now shows Timestamp
    -Cache Clear now requires Confirmation
    -Deleting CacheEntry now requires Confirmation
    -Deleting HistoryEntry now requires Confirmation

6.2.1: 18.07.2021
    -Fixed Regex Patterns

6.2.0: 18.07.2021
    -Changed how Settings init
    -History is now in right Order
    -Added Filter List to Main Page

6.1.1: 10.07.2021
    -Updated Readme

6.1.0: 06.07.2021
    -Finished History Implementation
    -Typo in Readme

6.0.0: 30.06.2021
    -Added History
    -Refractor of CodeBase
    -Fixed Error when rating last Episode
    -CacheViewer can now sort
    -Now gets EpisodeNumber if Cache has 0
    -CacheViewer now closes Info when pressing Escape

5.0.0: 04.06.2021
    -Refractor of CodeBase
    -Improved Player Skips

4.5.1: 21.05.2021
    -Made KAA skip more reliable

4.5.0: 21.05.2021
    -Players can now skip 1:27 when double pressing 's'

4.4.0: 20.05.2021
    -Now renames user-added Bookmarks in BookmarkFolder

4.3.6: 18.05.2021
    -Fixed DRP sometimes not working
    -Fixed message port closed without response

4.3.5: 16.05.2021
    -Improved 9anime urlPattern
    -Bookmarks from different Sites will now be deleted aswell
    -Checks every 30Min for an Update

4.3.4: 12.05.2021
    -Now automatically picks Server on KAA

4.3.3: 10.05.2021
    -Episode Update Message better Visuals

4.3.2: 07.05.2021
    -Fixed Slow API Call Detection

4.3.1: 07.05.2021
    -Cacheviewer now uses UL for MetaData

4.3.0: 07.05.2021
    -Implemented CacheViewer

4.2.0: 07.05.2021
    -Can now clear specific Cache in Debug
    -Shows AnimeName in UpdateSuccessMessage
    -Refractored Settings Page

4.1.6: 05.05.2021
    -BugFixes

4.1.5: 04.05.2021
    -DRP now shows Metaname instead of Sitename
    -English Title is preffered over Japanese Title

4.1.4: 25.04.2021
    -Improved Authentification-Site
    -Reactivating Updating now gets Usertoken when necessary

4.1.3: 21.04.2021
    -Extension now notifies the User when an Update is available

4.1.2: 21.04.2021
    -Fixed Changelog
    -Added VersionChecker to SettingsPage

4.1.1: 18.04.2021
    -Fixed Error that Cache is not returning ID

4.1.0: 13.04.2021
    -Added Message to notify the User about slow API

4.0.1: 12.04.2021
    -Manually inputting the AnimeID works again

4.0.0: 11.04.2021
    -Reworked Cache to make less API-Calls
    -Fixed Issues when initalizing Settings
    -Can now use existing Bookmark Folders

3.5.10: 30.03.2021
    -Optimized new Anime Pick Window
    -Changed Anime Rate Window to Select Tag
    -Fixed Error not being able to mark Anime as completed

3.5.9: 21.03.2021
    -Fixed Finishing Anime not removing Bookmark
    -Added Force Remove DRP Button to Settings
    -Anime Pick Window now shows Images

3.5.8: 01.03.2021
    -Fixed some 9anime Links not working

3.5.7: 26.02.2021
    -Added Option to Binge Watch
    -Changed DRP Update Time to 15sec

3.5.6: 24.02.2021
    -Added Regions to Code
    -Set limit to DRP Updates

3.5.5: 23.02.2021
    -Added Setting to check if this Episode is next
    -Added next Button to Episode Finished Div

3.5.4: 22.02.2021
    -Cleaned up settings.html

3.5.3: 22.02.2021
    -Added Login Prompt when activating DRP

3.5.2: 21.02.2021
    -Reduced DRP Updates
    -Better URL-Change handeling

3.5.1: 20.02.2021
    -Reduced DRP Updates when switching to next Episode

3.5.0: 19.02.2021
    -Added Discord Rich Presence
    -Fixed Div not going invisible

3.4.0: 17.02.2021
    -Added more Settings

3.3.3: 13.02.2021
    -Alert after Episode finished is now a div

3.3.2: 13.02.2021
    -Sequel Recommendation after last Episode

3.3.1: 06.02.2021
    -Bookmarks will now be removed with same id or same url

3.3.0: 06.02.2021
    -Auto Bookmark updating

3.2.0: 05.02.2021
    -Anime can now be finished via Extension

3.1.1: 02.02.2021
    -Added remove from storage function
    -httprequester is now persistent

3.1.0: 02.02.2021
    -Added gogoanimehub support

3.0.0: 02.02.2021
    -Refractored how Extension works
    -Sites are now safed as JSON-Objects

2.3.0: 02.02.2021
    -Added some logging to httprequester
    -Fixed Error when name is longer than 64 chars

2.2.1: 29.01.2021
    -Fixed User Input ID

2.2.0: 28.01.2021
    -Cache now works properly

2.1.0: 28.01.2021
    -Bug Fixes
    -Changed popup.html to not use alert
    -Added popup.html Feedback
    -secret.json file handling improved
    -Removed need of popup.html
    -Handle Access-Denial to Account

2.0.3: 27.01.2021
    -Updated README.md
    -Can now read all kickassanime and 9anime links
    -Bug Fixes

2.0.2: 27.01.2021
    -Fixed Auth Storage not working
    -Added Code Comments
    -Refresh Tokens when starting

2.0.1: 27.01.2021
    -Refresh Token is now saved in ms
    -Bug Fixes
    -Refresh Token updates after 28 Days
    -Changed github page to darkmode
    -Added Icon

2.0.0: 27.01.2021
    -Added 9anime.to support
    -Updated README.md
    -Added MAL_App_Template.jpg

1.1.0: 27.01.2021
    -Updated README.md
    -Stylized popup.html
    -Stylized index.html

1.0.0: 27.01.2021
    -First working Version