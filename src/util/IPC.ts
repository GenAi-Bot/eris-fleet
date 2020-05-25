import {EventEmitter} from 'events';
import { resolve } from 'dns';
import {UUID as Gen} from './UUID';

export class IPC extends EventEmitter {
    events: Map<string | number, {fn: Function}>;
    commandUUID: Map<string, string>;

    public constructor() {
        super();
        this.events = new Map();
        this.commandUUID = new Map();

        process.on('message', msg => {
            let event = this.events.get(msg.op);
            if (event) {
                event.fn(msg);
            }
        });
    }

    public register(event: string, callback: Function) {
        if (this.events.get(event)) {
            //@ts-ignore
            process.send({op: "error", msg: "IPC | Can't register 2 events with the same name."});
        } else {
            this.events.set(event, {fn: callback});
        }
    }

    public unregister(event:string) {
        this.events.delete(event);
    }

    public broadcast(op: string, message?: any) {
        if (!message) message = null;
        //@ts-ignore
        process.send({op: "broadcast", event: {op, msg: message}});
    }

    public sendTo(cluster: number, op: string, message?: any) {
        if (!message) message = null;
        //@ts-ignore
        process.send({op: "sendTo", cluster: cluster, event: {msg: message, op}});
    }

    public async fetchUser(id: number) {
        //@ts-ignore
        process.send({op: "fetchUser", id});

        return new Promise((resolve, reject) => {
            const callback = (r: any) => {
                //@ts-ignore
                this.removeListener(id,  callback);
                resolve(r);
            };

            //@ts-ignore
            this.on(id, callback);
        })
    }

    public async fetchGuild(id: number) {
        //@ts-ignore
        process.send({op: "fetchGuild", id});

        return new Promise((resolve, reject) => {
            const callback = (r: any) => {
                //@ts-ignore
                this.removeListener(id,  callback);
                resolve(r);
            };

            //@ts-ignore
            this.on(id, callback);
        })
    }

    public async fetchChannel(id: number) {
        //@ts-ignore
        process.send({op: "fetchChannel", id});

        return new Promise((resolve, reject) => {
            const callback = (r: any) => {
                //@ts-ignore
                this.removeListener(id,  callback);
                resolve(r);
            };

            //@ts-ignore
            this.on(id, callback);
        })
    }

    public async fetchMember(guildID: number, memberID: number) {
        //@ts-ignore
        process.send({op: "fetchMember", guildID, memberID});

        return new Promise((resolve, reject) => {
            const callback = (r: any) => {
                //@ts-ignore
                this.removeListener(memberID,  callback);
                resolve(r);
            };

            //@ts-ignore
            this.on(memberID, callback);
        })
    }

    public async command(service: string, message?: any, receptive?: Boolean) {
        if (!message) message = null;
        if (!receptive) receptive = false;
        const UUID = String(new Gen());
        this.commandUUID.set(UUID, service);
        //@ts-ignore
        process.send({op: "serviceCommand", 
            command: {
                service,
                msg: message,
                UUID,
                receptive
            }
        });

        if (receptive) {
            return new Promise((resolve, reject) => {
                const callback = (r: any) => {
                    this.commandUUID.delete(UUID);
                    //@ts-ignore
                    this.removeListener(UUID, callback);
                    if (r.err) {
                        reject(r.err);
                    } else {
                    resolve(r.value);
                    }
                };
    
                //@ts-ignore
                this.on(UUID, callback);
            })
        }
    }

    public async getStats() {
        //@ts-ignore
        process.send({op: "getStats"});

        return new Promise((resolve, reject) => {
            const callback = (r: any) => {
                //@ts-ignore
                this.removeListener("statsReturn",  callback);
                resolve(r);
            };

            //@ts-ignore
            this.on("statsReturn", callback);
        })
    }
}