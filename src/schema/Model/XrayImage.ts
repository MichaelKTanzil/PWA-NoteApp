import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export default class XrayImage extends Model {
  static table = "xray_images";

  @text("patient_name") patientName!: string;
  @text("local_file_id") localFileId?: string;
  @text("file_path") filePath?: string;
  @field("is_synced") isSynced!: boolean;
}
