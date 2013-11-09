module.exports = function(compound) {
    var app = compound.app;
    compound.tools.rotation = function db() {
        compound.models.Repository.processNext();
    };

    compound.tools.rotation.help = {
        shortcut:    'rt',
        usage:       'rt',
        description: 'Check next project'
    };
};
