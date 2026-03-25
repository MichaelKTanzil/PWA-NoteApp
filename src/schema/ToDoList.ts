import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export default class ToDoList extends Model {
  static table = "to_do_lists";

  @text("title") title!: string;
  @text("content") content!: string;
  @field("priority") priority!: number;
  @field("is_completed") is_completed!: boolean;
}
