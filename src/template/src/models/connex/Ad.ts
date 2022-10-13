import { Entity, PrimaryKey, Property, Enum } from "@mikro-orm/core";

export enum AdPlacement {
  LEFT,
  RIGHT,
  CENTER,
}

@Entity()
export default class Ad {
  @PrimaryKey()
  public id!: number;

  @Property()
  public title?: string;

  @Property()
  public url?: string;

  @Property()
  public imgSmall?: string;

  @Property()
  public imgMedium?: string;

  @Property()
  public imgLarge?: string;

  @Property()
  public active = true;

  @Enum()
  public placement = AdPlacement.LEFT;
}
