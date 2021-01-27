/* global Workdata, Config, Manifest */
import React from 'react';
import MediaQuery from 'react-responsive';
import { observer } from 'mobx-react';
import { observable, action, computed } from 'mobx';

import destiny2 from './destiny2';
import Armor from './models/Armor.jsx';
import Loadout from './models/Loadout.jsx';
import CharacterList from './models/Character.jsx';
import LoadoutOptimizer from './LoadoutOptimizer.jsx';
import Filter from './Filter.jsx';

import { Divider, Button } from 'antd';

const Status = {
    NOT_AUTHORIZED: null,
    AUTHORIZING: 'authorizing',
    LOADING: 'loading',
    READY: 'ready'
};

const ItemType = {
    ARMOR: 2
};

@observer export default class MainPage extends React.Component {

    @observable accessToken = "CMPzAhKGAgAgrWyTZ0awJs3znNQ5opyLtljmlwPoqDHc93G5Fi0NFJvgAAAA6aP9vHKUsWfnmh8bOyDxm7+/BznEwyYfuCKORwMXNsc7s5XaKRwgcLWa55QUf+4OjSpK1mE2OI0JuReJujpmTRNdsEIDXdCk465GIqhsHOrr9kAzgUG57sSXhUq+U9h/dz/j2e47v5EypLoLuDj8/8NnV5j5hFhwH9h4nXrZZYTv64DIElBYUJTwcy7/oEdjUADLtrMvxQS8MmskO8HCCWGX1u7r6bKbaCs4zbECQvjMy4zv0aOmYiAeNQurQOD9jLB4JztWoWQQDHZZdkkxgbvWovR2npYG814HmZeDh9A=";

    constructor() {
        super();

        //this.accessToken = localStorage.getItem('accessToken');
        if (this.accessToken) {
            this.getCurrentUser();
        }
    }

    @computed get status() {
        if (!this.accessToken) {
            console.log('status: not authorized')
            return Status.NOT_AUTHORIZED;
        }

        if (this.profile && this.profile.characters.length === this.characters.length) {
            console.log('status: ready')
            return Status.READY;
        }

        console.log('status: loading')
        return Status.LOADING;
    }

    @action.bound authorize() {
        const url = 'https://www.bungie.net/en/OAuth/Authorize?client_id=34984&response_type=code';
        window.open(url, 'Authorize with Bungie'); // , "width=600, height=800");
        window.addEventListener('storage', this.authorized);
    }

    @action.bound authorized() {
        console.log('getting access token from localStorage')
        this.accessToken = localStorage.getItem('accessToken');
        this.accessTokenError = localStorage.getItem('accessTokenError');
        console.log('got token', this.accessToken);
        this.getCurrentUser();
    }

    // @observable user = Workdata.user;
    // @observable profile = Workdata.profile;
    // @observable characters = Workdata.characters;
    @observable user;
    @observable profile;
    @observable characters = [];
    @observable model;
    @observable activeCharacterId;

    get userName() {
        return this.user ? this.user.destinyMemberships[0].LastSeenDisplayName : null;
    }

    get membershipType() {
        return this.user ? this.user.destinyMemberships[0].membershipType : null;
    }

    get membershipId() {
        return this.user ? this.user.destinyMemberships[0].membershipId : null;
    }

    getCurrentUser() {
        destiny2.getCurrentUser(this.accessToken).then(resUser => {
            this.receiveUser(resUser);
            destiny2.getProfile(this.membershipType, this.membershipId).then(resProfile => {
                this.receiveProfile(resProfile);

                this.profile.characters.forEach(character => {
                    destiny2.getCharacter(this.membershipType, this.membershipId, character.characterId, this.accessToken).then(resChar => {
                        this.receiveCharacter(resChar);
                    });
                });
            });
        })
        .catch(error => {
            console.log('getCurrentUser error', error);
            this.handleFailure();
        });
    }

    @action receiveUser(data) {
        this.user = data;
    }

    @action receiveProfile(data) {
        this.profile = data;
    }

    @action receiveCharacter(data) {
        this.characters.push(data);
    }

    @computed get charactersLoaded() {
        this.characters.length > 0;
    }

    @action.bound handleFailure() {
        localStorage.removeItem('accessToken');
        this.accessToken = null;
    }

    @action.bound changeCharacter(characterId) {
        this.activeCharacterId = characterId;
        this.model = new CharacterDataModel({ data: this.characterData(this.activeCharacterId) });
    }

    characterData(characterId) {
        return this.characters ? this.characters.find(c => c.characterId === characterId) : null;
    }

    render() {
        const headerRow = (
            <div className="flex-container header-container">
                <div>
                    <h1>D2 Loadout Optimizer</h1>
                </div>
                <div className="right">
                    <h2>{this.userName}</h2>
                </div>
            </div>
        );

        const authorizeRow = this.status === Status.NOT_AUTHORIZED ? (
            <div>
                <Button type="primary" size="large" onClick={this.authorize}>Authorize with Bungie</Button>
            </div>
        ) : null;

        const loadingRow = this.status === Status.LOADING ? (
            <div>
                <h1>LOADING...</h1>
            </div>
        ) : null;

        const characterList = this.status === Status.READY ? (
            <div>
                <Divider plain>
                    Select character
                </Divider>
                <CharacterList
                    characters={ this.profile.characters }
                    activeCharacterId={ this.activeCharacterId }
                    onClick={ this.changeCharacter }
                />
            </div>
        ) : null;

        const filterComp = this.activeCharacterId ? (
            <div>
                <Divider plain>
                    Pin armor items
                </Divider>
                <Filter model={ this.model } />
            </div>
        ) : null;

        const loadoutComp = this.model ? (
            <div>
                <Divider plain>Loadouts</Divider>
                <LoadoutOptimizer model={ this.model } />
            </div>
        ) : null;

        const footerRow = (
            <Divider plain>
                &copy; <a href="https://destinypvpstats.com">destinypvpstats.com</a>
            </Divider>
        );

        return (
            <div>
                { headerRow }
                { authorizeRow }
                { loadingRow }

                {/* { data ? <pre>{JSON.stringify(this.armorList, null, 2)}</pre> : null } */}

                <MediaQuery query="(max-width: 999px)">
                    { characterList }
                    { filterComp }
                    { loadoutComp }
                </MediaQuery>

                <MediaQuery query="(min-width: 1000px)">
                    <div className="flex-container">
                        <div>
                            { characterList }
                            { filterComp }
                        </div>
                        <div>
                            { loadoutComp }
                        </div>
                        <div />
                    </div>
                </MediaQuery>

                { footerRow }
            </div>
        );
    }
}


class CharacterDataModel {

    @observable includeMods = false;
    @observable armorFilter = [];

    constructor(args) {
        Object.assign(this, args);
    }

    @computed get armorList() {
        const data = this.data;
        if (!data) {
            return [];
        }

        const list = [];

        const addArmor = item => {
            const instance = data.itemComponents.instances.data[item.itemInstanceId];
            const statItem = data.itemComponents.stats.data[item.itemInstanceId] ? data.itemComponents.stats.data[item.itemInstanceId].stats : null;
            const perkItem = data.itemComponents.perks.data[item.itemInstanceId] ? data.itemComponents.perks.data[item.itemInstanceId].perks : null;
            const manifestItem = Manifest.DestinyInventoryItemDefinition[item.itemHash];

            const isArmor = manifestItem && manifestItem.itemType === ItemType.ARMOR;

            //todo: check that armor class matches character class

            if (instance && isArmor) {

                const armor = new Armor();
                armor.initFromData(item, instance, manifestItem, statItem, perkItem, this.includeMods);
                list.push(armor);
            }
        };

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
        console.log('building loadouts');
        const list = [];
        this.helmets.forEach(helmet => {
            this.arms.forEach(arm => {
                this.chests.forEach(chest => {
                    this.legs.forEach(leg => {
                        this.classitems.forEach(classitem => {
                            const args = {
                                helmet: helmet,
                                arms: arm,
                                chest: chest,
                                legs: leg,
                                classitem: classitem
                            };
                            const loadout = new Loadout(args);
                            if (loadout.isValid && loadout.passesFilter(this.armorFilter)) {
                                list.push(loadout);
                            }
                        });
                    });
                });
            });
        });
        return list;
    }

    @action addToArmorFilter(value) {
        if (!this.armorFilter.find(item => item.id === value)) {
            this.armorFilter.push(value);
        }
    }

    @action removeFromArmorFilter(value) {
        this.armorFilter = this.armorFilter.filter(id => id !== value);
    }

    @computed get pinnedItems() {
        return this.armorList.filter(item => this.armorFilter.find(id => id === item.id));
    }

    @action toggleIncludeMods() {
        this.includeMods = !this.includeMods;
    }
}
