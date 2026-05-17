export type Island = {
  id: string;
  url: URL;
  props: Record<string, string>;
};

export type BuildOptions = {
  dev: boolean;
  entries: {
    documents: string[];
    worker: string;
  };
  root: string;
  dist: string;
  markdownTemplate: string;
};
