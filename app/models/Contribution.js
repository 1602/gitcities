module.exports = function(compound, Contribution) {
    Contribution.belongsTo('user');
    Contribution.belongsTo('repository');
};
