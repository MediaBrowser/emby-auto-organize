﻿define(['libraryMenu', 'emby-input', 'emby-select', 'emby-checkbox', 'emby-button', 'emby-collapse'], function (libraryMenu) {
    'use strict';

    ApiClient.getFileOrganizationResults = function (options) {

        var url = this.getUrl("Library/FileOrganization", options || {});

        return this.getJSON(url);
    };

    ApiClient.deleteOriginalFileFromOrganizationResult = function (id) {

        var url = this.getUrl("Library/FileOrganizations/" + id + "/File");

        return this.ajax({
            type: "DELETE",
            url: url
        });
    };

    ApiClient.clearOrganizationLog = function () {

        var url = this.getUrl("Library/FileOrganizations");

        return this.ajax({
            type: "DELETE",
            url: url
        });
    };

    ApiClient.performOrganization = function (id) {

        var url = this.getUrl("Library/FileOrganizations/" + id + "/Organize");

        return this.ajax({
            type: "POST",
            url: url
        });
    };

    ApiClient.performEpisodeOrganization = function (id, options) {

        var url = this.getUrl("Library/FileOrganizations/" + id + "/Episode/Organize");

        return this.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(options),
            contentType: 'application/json'
        });
    };

    ApiClient.performMovieOrganization = function (id, options) {

        var url = this.getUrl("Library/FileOrganizations/" + id + "/Movie/Organize");

        return this.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(options),
            contentType: 'application/json'
        });
    };

    ApiClient.getSmartMatchInfos = function (options) {

        options = options || {};

        var url = this.getUrl("Library/FileOrganizations/SmartMatches", options);

        return this.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });
    };

    ApiClient.deleteSmartMatchEntries = function (entries) {

        var url = this.getUrl("Library/FileOrganizations/SmartMatches/Delete");

        var postData = {
            Entries: entries
        };

        return this.ajax({

            type: "POST",
            url: url,
            data: JSON.stringify(postData),
            contentType: "application/json"
        });
    };

    function getMovieFileName(value) {
        var movieName = "Movie Name";
        var fileName = movieName + '.2017.MULTI.1080p.BluRay.DTS.x264-UTT.mkv';

        var result = value.replace('%mn', movieName)
            .replace('%m.n', movieName.replace(' ', '.'))
            .replace('%m_n', movieName.replace(' ', '_'))
            .replace('%ext', 'mkv')
            .replace('%fn', fileName);

        return result;
    }

    function loadPage(view, config) {

        var movieOptions = config.MovieOptions;

        view.querySelector('#chkEnableMovieSorting').checked = movieOptions.IsEnabled;
        view.querySelector('#chkOverwriteExistingMovies').checked = movieOptions.OverwriteExistingFiles;
        view.querySelector('#chkDeleteEmptyMovieFolders').checked = movieOptions.DeleteEmptyFolders;

        view.querySelector('#txtMovieMinFileSize').value = movieOptions.MinFileSizeMb;
        view.querySelector('#txtMoviePattern').value = movieOptions.MoviePattern;
        view.querySelector('#txtWatchMovieFolder').value = movieOptions.WatchLocations[0] || '';

        view.querySelector('#txtDeleteLeftOverMovieFiles').value = movieOptions.LeftOverFileExtensionsToDelete.join(';');

        view.querySelector('#copyOrMoveMovieFile').value = movieOptions.CopyOriginalFile.toString();
    }

    function onSubmit(view) {

        ApiClient.getNamedConfiguration('autoorganize').then(function (config) {

            var movieOptions = config.MovieOptions;
            
            movieOptions.IsEnabled = view.querySelector('#chkEnableMovieSorting').checked;
            movieOptions.OverwriteExistingEpisodes = view.querySelector('#chkOverwriteExistingMovies').checked;
            movieOptions.DeleteEmptyFolders = view.querySelector('#chkDeleteEmptyMovieFolders').checked;

            movieOptions.MinFileSizeMb = view.querySelector('#txtMovieMinFileSize').value;
            movieOptions.SeasonFolderPattern = view.querySelector('#txtMoviePattern').value;
            movieOptions.LeftOverFileExtensionsToDelete = view.querySelector('#txtDeleteLeftOverMovieFiles').value.split(';');

            var watchLocation = view.querySelector('#txtWatchMovieFolder').value;
            movieOptions.WatchLocations = watchLocation ? [watchLocation] : [];

            movieOptions.CopyOriginalFile = view.querySelector('#copyOrMoveMovieFile').value;

            ApiClient.updateNamedConfiguration('autoorganize', config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
        });

        return false;
    }

    function getTabs() {
        return [
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeLog'),
                name: 'Activity Log'
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeTv'),
                name: 'TV'
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeMovie'),
                name: 'Movie'
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizeSmart'),
                name: 'Smart Matches'
            }];
    }

    return function (view, params) {

        function updateMoviePatternHelp() {

            var value = view.querySelector('#txtMoviePattern').value;
            value = getMovieFileName(value);

            var replacementHtmlResult = 'Result: ' + value;

            view.querySelector('.moviePatternDescription').innerHTML = replacementHtmlResult;
        }

        function selectWatchFolder(e) {

            require(['directorybrowser'], function (directoryBrowser) {

                var picker = new directoryBrowser();

                picker.show({

                    callback: function (path) {

                        if (path) {

                            view.querySelector('#txtWatchMovieFolder').value = path;
                        }
                        picker.close();
                    },
                    header: 'Select Watch Folder',
                    validateWriteable: true
                });
            });
        }

        view.querySelector('#btnSelectWatchMovieFolder').addEventListener('click', selectWatchFolder);

        view.querySelector('#txtMoviePattern').addEventListener('change', updateMoviePatternHelp);
        view.querySelector('#txtMoviePattern').addEventListener('keyup', updateMoviePatternHelp);

        view.querySelector('.libraryFileOrganizerForm').addEventListener('submit', function (e) {
            e.preventDefault();
            onSubmit(view);
            return false;
        });

        view.addEventListener('viewshow', function (e) {

            libraryMenu.setTabs('autoorganize', 2, getTabs);

            ApiClient.getNamedConfiguration('autoorganize').then(function (config) {
                loadPage(view, config);
                updateMoviePatternHelp();
            });
        });
    };
});