/* global Workdata */
import React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed } from 'mobx';

import Armor from './models/Armor.jsx';
import Loadout from './models/Loadout.jsx';

const ItemType = {
    ARMOR: 2
}

const SortOrder = {
    NONE: 'none',
    VALUE: 'value',
    WASTE: 'totalWaste',
    POTENTIAL: 'potential'
}

@observer export default class LoadoutOptimizer extends React.Component {

    @observable includeMods = false;
    @observable showRawData = false;
    @observable sortby = SortOrder.VALUE;

    perPage = 20;

    @computed get armorList() {
        const data = this.props.data;
        if (!data) {
            return [];
        }

        const list = [];

        const addArmor = (item) => {
            const instance = data.itemComponents.instances.data[item.itemInstanceId];
            const statItem = data.itemComponents.stats.data[item.itemInstanceId] ? data.itemComponents.stats.data[item.itemInstanceId].stats : null;
            const perkItem = data.itemComponents.perks.data[item.itemInstanceId] ? data.itemComponents.perks.data[item.itemInstanceId].perks : null;
            const manifestItem = Manifest.DestinyInventoryItemDefinition[item.itemHash];
            
            const isArmor = manifestItem && manifestItem.itemType === ItemType.ARMOR;

            if (instance && isArmor) {

                const armor = new Armor();
                armor.initFromData(item, instance, manifestItem, statItem, perkItem, this.includeMods);
                list.push(armor);
            }
        }

        data.equipment.data.items.forEach(item => addArmor(item));
        data.inventory.data.items.forEach(item => addArmor(item));
        
        return list;
    }

    @computed get helmets() {
      return this.armorList.filter(item => item.isHelmet);
    }

    @computed get arms() {
      return this.armorList.filter(item => item.isArms);
    }

    @computed get chests() {
      return this.armorList.filter(item => item.isChest);
    }

    @computed get legs() {
      return this.armorList.filter(item => item.isLegs);
    }

    @computed get classitems() {
      return this.armorList.filter(item => item.isClassitem);
    }

    @computed get loadouts() {
        console.log('building loadouts')
        const list = [];
        this.helmets.forEach(helmet => {
            this.arms.forEach(arm=> {
                this.chests.forEach(chest => {
                    this.legs.forEach(leg => {
                        this.classitems.forEach(classitem => {
                            const args = {
                                helmet: helmet,
                                arms: arm,
                                chest: chest,
                                legs: leg,
                                classitem: classitem,
                            };
                            const loadout = new Loadout(args);
                            if (loadout.isValid) {
                                list.push(loadout);
                            }
                        })
                    })
                })
            })
        });
        return list;
    }

    @computed get sortedLoadouts() {
        if (this.sortby === SortOrder.NONE) {
            return this.loadouts;
        }

        let r = 1;
        if (this.sortby === SortOrder.WASTE) {
            r = -1;
        }

        return this.loadouts.sort((a, b) => {
            if (a[this.sortby] > b[this.sortby]) {
                return -r;
            }
            if (a[this.sortby] < b[this.sortby]) {
                return r;
            }
            return 0;
        });        
    }

    @action.bound toggleIncludeMods() {
        this.includeMods = !this.includeMods;
    }

    @action.bound changeSortOrder(e) {
        this.sortby = e.target.value;
    }

    render() {
        console.log('loadouts', this.loadouts.length)
        console.log('this.sortby', this.sortby)

        // const armorLists = [this.helmets, this.arms, this.chests, this.legs, this.classitems].map(list => (
        //   <div>
        //     {list.map(item => item.show())}
        //   </div>
        // ));

        const buttonStyle = "btn btn-primary";

        const navigationRow = (
            <div className="container">
              <div className="row mt-3 mb-2 ">
                  <div className="col-sm-12 text-right">
                      <div className="btn-group">
                          <label className={buttonStyle}>
                              <input type="checkbox" onChange={this.toggleIncludeMods} /> Include inserted mods (?)
                          </label>
                      </div>
                      <div className="btn-group btn-group-toggle ml-3">
                          <label className={this.sortby === SortOrder.VALUE ? buttonStyle + " active" : buttonStyle}>
                              <input type="radio" name="sortby" value={SortOrder.VALUE} onClick={this.changeSortOrder}
                              /> Sort by value
                          </label>
                          <label className={this.sortby === SortOrder.WASTE ? buttonStyle + " active" : buttonStyle}>
                              <input type="radio" name="sortby" value={SortOrder.WASTE} onClick={this.changeSortOrder}
                              /> Sort by waste
                          </label>
                          <label className={this.sortby === SortOrder.POTENTIAL ? buttonStyle + " active" : buttonStyle}>
                              <input type="radio" name="sortby" value={SortOrder.POTENTIAL} onClick={this.changeSortOrder}
                              /> Sort by potential
                          </label>
                      </div>
                  </div>
              </div>
            </div>
        );

        return (
            <div>
                {navigationRow}
                {/* {armorLists} */}
                {/* { this.props.data ? <pre>{JSON.stringify(this.armorList, null, 2)}</pre> : null } */}
                <div className="container">
                    {this.sortedLoadouts.slice(0, this.perPage).map(l => l.show())}
                </div>
                {this.showRawData && (
                    <div>
                        <pre>
                            {JSON.stringify(this.user, null, 2)}
                        </pre>
                        <br/>
                        Destiny Profile
                        <pre>
                            {JSON.stringify(this.profile, null, 2)}
                        </pre>
                        <pre>
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    }
}

