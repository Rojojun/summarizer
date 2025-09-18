export interface GitLabProject {
    id: number;
    name: string;
    name_with_namespace: string;
    path: string;
    path_with_namespace: string;
    description?: string;
    default_branch: string;
    web_url: string;
    avatar_url?: string;
    star_count: number;
    forks_count: number;
    last_activity_at: string;
    namespace: {
        id: number;
        name: string;
        path: string;
        kind: string;
    };
}

export interface ProjectChoice {
    name: string;
    value: GitLabProject;
    short: string;
}

export interface GitLabMR {
    id: number;
    iid: number; // internal ID
    title: string;
    description?: string;
    state: 'opened' | 'closed' | 'merged';
    created_at: string;
    updated_at: string;
    merged_at?: string;
    closed_at?: string;
    author: {
        name: string;
        username: string;
    };
    target_branch: string;
    source_branch: string;
    web_url: string;
    merge_status: string;
    user_notes_count: number;
    upvotes: number;
    downvotes: number;
}

export interface MRChoice {
    name: string;
    value: GitLabMR;
    short: string;
}

export interface GitLabCommit {
    id: string;
    short_id: string;
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
}

export interface GitLabNote {
    id: number;
    author: {
        id: number;
        name: string;
        username: string;
        avatar_url: string;
    };
    body: string;
    created_at: string;
    updated_at: string;
    system: boolean;
    resolvable: boolean;
    resolved: boolean;
}

export interface GitLabChanges {
    old_path: string;
    new_path: string;
    a_mode: string;
    b_mode: string;
    diff: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
}

export interface MRAnalysisData {
    // 기본 MR 정보
    mrInfo: {
        title: string;
        description: string;
        author: string;
        created_at: string;
        updated_at: string;
        source_branch: string;
        target_branch: string;
        state: string;
        labels: string[];
    };

    // 커밋 정보
    commits: {
        title: string;
        message: string;
        author: string;
        date: string;
        short_id: string;
    }[];

    // 파일 변경사항
    changes: {
        file_path: string;
        change_type: 'added' | 'modified' | 'deleted' | 'renamed';
        old_path?: string;
        new_path: string;
        diff_snippet?: string; // diff의 일부만
    }[];

    // 코드 리뷰 및 댓글
    reviews: {
        author: string;
        comment: string;
        created_at: string;
        is_system: boolean;
    }[];

    // 통계 정보
    stats: {
        files_changed: number;
        additions: number;
        deletions: number;
        commits_count: number;
        comments_count: number;
    };
}