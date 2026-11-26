<script lang="ts">
  import { Dialog, DialogContent, DialogTrigger } from "@zealakit/overlay-svelte";
  import { Select } from "../../dist/select/index.js";

  let { withPopover = false } = $props();
</script>

<Dialog>
  <DialogTrigger data-testid="dialog-trigger">Open dialog</DialogTrigger>
  <DialogContent data-testid="dialog-content">
    <Select.Root>
      <Select.Label>Fruit</Select.Label>
      <Select.Control>
        <Select.Input />
        <Select.Trigger>
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
      </Select.Control>
      <Select.Popover>
        <Select.List>
          <Select.Item value="apple">Apple</Select.Item>
        </Select.List>
      </Select.Popover>
    </Select.Root>
  </DialogContent>
</Dialog>
