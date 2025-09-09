import {Info} from "./Info";
import axios, {AxiosInstance} from "axios";

export class GitlabInfo extends Info {
    private readonly _client: AxiosInstance;

    constructor(gitlabUrl: String, accessToken: string) {
        super(accessToken);
        this._client = axios.create({
            baseURL: `${gitlabUrl}/api/v4`,
            headers: {
                'PRIVATE-TOKEN': accessToken
            },
            timeout: 40000
        })
    }


    get client(): AxiosInstance {
        return this._client;
    }
}