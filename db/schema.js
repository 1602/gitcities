define('User', function() {
    property('username', String, { index: true });
    property('email', String, { index: true });
    property('karma', Number);
});

define('Commit', function() {
    property('hash', String);
    property('username', String);
    property('date', Date);

    set('defaultSort', 'date DESC');
});

define('Repository', function() {
    property('name', String, {index: true});
    property('lastCheckedAt', Date);
    property('karma', Number);

    set('defaultSort', 'lastCheckedAt ASC');
});

