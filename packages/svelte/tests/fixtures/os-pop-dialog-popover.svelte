<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogTrigger,
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@zealakit/overlay-svelte";
  import { Select } from "../../dist/select/index.js";
</script>

<Dialog>
  <DialogTrigger data-testid="dialog-trigger">Open dialog</DialogTrigger>
  <DialogContent data-testid="dialog-content">
    <Popover>
      <PopoverTrigger data-testid="popover-trigger">Open popover</PopoverTrigger>
      <PopoverContent data-testid="popover-content">
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
      </PopoverContent>
    </Popover>
  </DialogContent>
</Dialog>
