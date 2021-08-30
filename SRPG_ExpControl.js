//=============================================================================
//SRPG_ExpControl.js
// Simple plugin to allows User to control exp for each skill.
//=============================================================================
/*:
 * @plugindesc Simple plugin to allows User to control exp for each skill. Only work in SRPG mode
 * @author Shoukang
 *
 * @help
 * This plugin provides no plugin parameters
 * ===================================================================================================
 * Compatibility:
 * Place it below SRPG_AoEAnimation if you use.
 * ===================================================================================================
 * Skill note tag:
 * <srpgExp: x> set the exp to certain value, can also be a formula.
 * values you can use for the formula:
 * a       the actor, same as damage formula
 * dif     the exp difference from this level exp to next level exp.
 * ===================================================================================================
 * v 1.00 First Release
 */
 //=============================================================================
// SRPG_ExpRate.js
//=============================================================================
/*:
  * @plugindesc A plugin that modifies how exp is gained through battles 
 * @author Boomy 
 * 
 * @param Regular EXP Formula 
 * @desc Lunatic code formula that calculates how much exp the user gets from a regular hit on a foe  
 * Can use parameters such as actor and enemy 
 * @default  enemy.exp() * 0.1
 * 
 * @param Kill EXP Formula 
 * @desc Lunatic code formula that calculates how much exp the user gets from a kill 
 * Can use parameters such as actor and enemy 
 * @default enemy.exp() * 0.4
 *  
 * @param Skill EXP Formula 
 * @desc Lunatic code formula that calculates how much exp the user gets from a skill not targetting a foe 
 * Can use parameters such as actor
 * @default (actor.nextLevelExp() - actor.currentLevelExp()) * 0.1
 */
//===============================================================
// Parameter Variables
//===============================================================
(function () {
    //=================================================================================================
    //Plugin Parameters
    //=================================================================================================
	var parameters = PluginManager.parameters('SRPG_ExpControl');

    var _useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        if ($gameSystem.isSRPGMode() && this.isActor() && DataManager.isSkill(item) &&
            item.meta.srpgExp) {
            var a = this;
            var dif = this.nextLevelExp() - this.currentLevelExp();
            $gameTroop.setSrpgExp(eval(item.meta.srpgExp))
        }
        _useItem.call(this, item);
    };

    var _SRPG_Game_Troop_expTotal = Game_Troop.prototype.expTotal;
    Game_Troop.prototype.expTotal = function () {
        if ($gameSystem.isSRPGMode() == true) {
            var actor = $gameParty.battleMembers()[0];
            if (this.SrpgBattleEnemys() && this.SrpgBattleEnemys().length > 0) {
                if (this.isAllDead()) {
                    var exp = this.deadMembers().reduce(function (r, enemy) {
                        return r + eval(parameters['Kill EXP Formula']);
                    }, 0);
                    return Math.floor(exp);
                } else {
                    var exp = 0;
                    for (var i = 0; i < this.members().length; i++) {
                        var enemy = this.members()[i];
                        exp += eval(parameters['Regular EXP Formula']);
                    }
                    return Math.floor(exp);
                }
            } else {
                var exp = eval(parameters['Skill EXP Formula']);
                return Math.floor(exp);
            }
        } else {
            return _SRPG_Game_Troop_expTotal.call(this);
        }
    };

    Game_Troop.prototype.setSrpgExp = function(exp) {
        this._srpgExp = exp;
    };

    Game_Troop.prototype.clearSrpgExp = function() {
        this._srpgExp = undefined;
    };

    var _srpgAfterAction = Scene_Map.prototype.srpgAfterAction;
    Scene_Map.prototype.srpgAfterAction = function() {
        if (this.srpgBattleFinished()){
            $gameTroop.clearSrpgExp();
        }
        _srpgAfterAction.call(this);
    };

    //check for whether AoE map battle is finished. Only useful when you have AoEAnimation plugin
    Scene_Map.prototype.srpgBattleFinished = function() {
        var livePartyMembers = $gameParty.battleMembers().filter(function(member) {
            return member.isAlive();
        });
        var activeType = $gameSystem.EventToUnit($gameTemp.activeEvent().eventId())[0]
        return (!$gameTemp.areaTargets || $gameTemp.areaTargets().length <= 0) ||
        (activeType == 'enemy' && $gameTroop.isAllDead()) || livePartyMembers.length <= 0;
    }

})();
