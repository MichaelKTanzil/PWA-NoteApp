import { Model } from "@nozbe/watermelondb";
import { text } from "@nozbe/watermelondb/decorators";

export default class Note extends Model {
  static table = "notes";

  @text("title") title!: string;
  @text("content") content!: string;
}
