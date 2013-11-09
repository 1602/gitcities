define('User', function() {
    property('username', String, { index: true });
    property('email', String, { index: true });
    property('karma', Number);
});

define('Commit', function() {
    property('id', String);
    property('userId', String);
    property('repoId', Number);
    property('date', Date);

    set('defaultSort', 'date DESC');
});

define('Repository', function() {
    property('name', String, {index: true});
    property('lastCheckedAt', Date, {default: function () {return new Date(0)}});
    property('karma', Number);
    property('watchers', Number);
    property('stars', Number);
    property('forks', Number);
    property('size', Number);
    property('issues', Number);
    property('network', Number);
    property('subscribers', Number);

    set('defaultSort', 'lastCheckedAt ASC');
});

