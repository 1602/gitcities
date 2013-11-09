var Application = module.exports = function Application(init) {
    init.before(function protectFromForgeryHook(ctl) {
        ctl.protectFromForgery('a55e277bc667197dd2e461aa7cd2980468a40b3d');
    });
};
