export abstract class Info {
    private readonly _accessToken: string

    protected constructor(accessToken: string) {
        this._accessToken = accessToken;
    }

    get accessToken(): string {
        return this._accessToken;
    }
}
