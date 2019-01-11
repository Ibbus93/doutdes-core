const AccessManager     = require('../engine/access-manager');
const TokenManager      = require('../engine/token-manager');
const DashboardsManager = require('../engine/dashboard-manager');
const CalendarManager   = require('../engine/calendar-manager');

const FacebookManager  = require('../engine/analytics/facebook-manager');
const InstagramManager = require('../engine/analytics/instagram-manager');
const GoogleManager    = require('../engine/analytics/google-manager');
const YoutubeManager   = require('../engine/analytics/youtube-manager');

const ErrorHandler = require('../engine/error-handler');

module.exports = function (app, passport) {
    //
    // function requireAuth, AccessManager.roleAuthorization(strategy) {
    //     return passport.authenticate.bind(passport)(strategy,  {session: false});
    // }

    /* PATHs */
    let indexPath  = "/";
    let amPath     = indexPath + 'users/';
    let keysPath   = indexPath + 'keys/';
    let dashPath   = indexPath + 'dashboards/';
    let calendPath = indexPath + 'calendar/';

    let googlePath    = indexPath + 'ga/';
    let facebookPath  = indexPath + 'fb/';
    let instagramPath = indexPath + 'ig/';
    let youtubePath   = indexPath + 'yt/';

    /* AUTH */
    const requireAuth = passport.authenticate('jwt', {session: false});
    const admin  = '0';
    const user   = '1';
    const editor = '2';
    const all = [admin, user, editor];

    // TODO gestire le delete bene: se il risultato restituito dalla query è 0, allora non ha eliminato niente

    const FB_METRIC = require('../api_handler/facebook-api').METRICS;

    /****************** ACCESS MANAGER ********************/
    app.post('/login', AccessManager.basicLogin);

    /****************** CRUD USERS ********************/
    app.post(amPath     + 'create/', AccessManager.createUser);
    app.get(amPath      + 'getFromId/', requireAuth, AccessManager.roleAuthorization(all), AccessManager.getUserById);
    app.put(amPath      + 'update/', requireAuth, AccessManager.roleAuthorization(all), AccessManager.updateUser);
    app.delete(amPath   + 'delete/', requireAuth, AccessManager.roleAuthorization([admin]), AccessManager.deleteUser);

    /****************** CRUD TOKENS ********************/
    app.post(keysPath   + 'insert/', requireAuth, AccessManager.roleAuthorization(all), TokenManager.insertKey);
    app.get(keysPath    + 'getAll/', requireAuth, AccessManager.roleAuthorization(all), TokenManager.readAllKeysById);
    app.get(keysPath    + 'checkIfExists/:type', requireAuth, AccessManager.roleAuthorization(all), TokenManager.checkExistence);
    app.put(keysPath    + 'update/', requireAuth, AccessManager.roleAuthorization(all), TokenManager.update);
    app.delete(keysPath + 'delete/', requireAuth, AccessManager.roleAuthorization(all), TokenManager.deleteKey);

    /****************** CRUD DASHBOARD ********************/
    app.get(dashPath    + 'getAllUserDashboards/', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.readUserDashboards);
    app.get(dashPath    + 'getDashboardByType/:type', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.getDashboardByType);
    app.get(dashPath    + 'getDashboardByID/:id', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.getDashboardByID);
    app.get(dashPath    + 'getChart/:dashboard_id/:chart_id', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.readChart);
    app.get(dashPath    + 'getChartsNotAddedByDashboard/:dashboard_id/', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.readNotAddedByDashboard);
    app.get(dashPath    + 'getChartsNotAddedByDashboardAndType/:dashboard_id/:type', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.readNotAddedByDashboardAndType);
    app.post(dashPath   + 'addChartToDashboard', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.addChartToDashboard);
    app.delete(dashPath + 'removeChartFromDashboard', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.removeChartFromDashboard);
    app.put(dashPath    + 'updateChartInDashboard', requireAuth, AccessManager.roleAuthorization(all), DashboardsManager.updateChartInDashboard);
    // app.post(dashPath   + 'assignDashboardToUser', requireAuth, AccessManager.roleAuthorization(all),DashboardsManager.assignDashboardToUser);
    app.delete(dashPath + 'deleteUserDashboard', requireAuth, AccessManager.roleAuthorization(all),DashboardsManager.deleteUserDashboard);
    app.post(dashPath   + 'createDashboard', requireAuth, AccessManager.roleAuthorization(all),DashboardsManager.createDashboard);
    app.delete(dashPath + 'deleteDashboard', requireAuth, AccessManager.roleAuthorization(all),DashboardsManager.deleteDashboard);

    /****************** FACEBOOK MANAGER ********************/
    app.get(facebookPath + 'fancount', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_FANS), FacebookManager.fb_getData);
    app.get(facebookPath + 'fancity', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_FANS_CITY), FacebookManager.fb_getData);
    app.get(facebookPath + 'fancountry', requireAuth, AccessManager.roleAuthorization(all),  FacebookManager.setMetric(FB_METRIC.P_FANS_COUNTRY), FacebookManager.fb_getData);
    app.get(facebookPath + 'engageduser', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_ENGAGED_USERS), FacebookManager.fb_getData);
    app.get(facebookPath + 'pageimpressions', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_IMPRESSIONS_UNIQUE), FacebookManager.fb_getData);
    app.get(facebookPath + 'pageimpressionscity', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_IMPRESSIONS_BY_CITY_UNIQUE),  FacebookManager.fb_getData);
    app.get(facebookPath + 'pageimpressionscountry', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_IMPRESSIONS_BY_COUNTRY_UNIQUE), FacebookManager.fb_getData);
    app.get(facebookPath + 'pagereactions', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_ACTION_POST_REACTIONS_TOTAL), FacebookManager.fb_getData);
    app.get(facebookPath + 'pageviewsexternals', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_VIEWS_EXT_REFERRALS), FacebookManager.fb_getData);
    app.get(facebookPath + 'pageviewstotal', requireAuth, AccessManager.roleAuthorization(all), FacebookManager.setMetric(FB_METRIC.P_VIEWS_TOTAL), FacebookManager.fb_getData);

    /****************** INSTAGRAM DASHBOARD ********************/
    app.get(instagramPath + 'reach', requireAuth, AccessManager.roleAuthorization(all), InstagramManager.ig_getReach);
    app.get(instagramPath + 'impressions', requireAuth, AccessManager.roleAuthorization(all), InstagramManager.ig_getImpressions);
    app.get(instagramPath + 'profviews', requireAuth, AccessManager.roleAuthorization(all), InstagramManager.ig_getProfileViews);

    /****************** GOOGLE MANAGER ********************/
    app.get(googlePath + 'sessions/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getLastYearSessions);
    app.get(googlePath + 'pageviews/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getPageViews);
    app.get(googlePath + 'mostviews/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getMostPagesViews);
    app.get(googlePath + 'sources/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getSources);
    app.get(googlePath + 'viewsbycountry/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getPageViewsByCountry);
    app.get(googlePath + 'browsers/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getBrowsers);
    app.get(googlePath + 'bouncerate/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getBounceRate);
    app.get(googlePath + 'avgsessionduration/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getAvgSessionDuration);
    app.get(googlePath + 'newusers/:start_date/:end_date', requireAuth, AccessManager.roleAuthorization(all), GoogleManager.ga_getNewUsers);

    /****************** GOOGLE MANAGER ********************/
    app.get(youtubePath + 'proof/', YoutubeManager.proof);

    /****************** CALENDAR MANAGER ******************/
    app.get(calendPath + 'getEvents', requireAuth, AccessManager.roleAuthorization(all), CalendarManager.getEvents);
    app.post(calendPath + 'addEvent', requireAuth, AccessManager.roleAuthorization(all), CalendarManager.addEvent);
    app.put(calendPath + 'updateEvent', requireAuth, AccessManager.roleAuthorization(all), CalendarManager.updateEvent);
    app.delete(calendPath + 'deleteEvent', requireAuth, AccessManager.roleAuthorization(all), CalendarManager.deleteEvent);

    /****************** ERROR HANDLER ********************/
    app.use(ErrorHandler.fun404);
};