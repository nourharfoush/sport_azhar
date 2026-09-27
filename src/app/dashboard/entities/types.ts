export interface RegionItem {
  _id: string;
  name: string;
  code: string;
}

export interface AdministrationItem {
  _id: string;
  name: string;
  code: string;
  region: { _id: string; name: string; code: string } | string;
}

export interface InstituteItem {
  _id: string;
  name: string;
  code: string;
  stage: string;
  type?: string;
  administration:
    | {
        _id: string;
        name: string;
        code: string;
        region?: { _id: string; name: string; code: string } | string;
      }
    | string;
}
