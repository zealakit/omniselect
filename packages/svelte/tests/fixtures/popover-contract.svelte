<script lang="ts">
  import { Select } from "../../dist/select/index.js";
</script>

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
      <Select.Item value="banana">Banana</Select.Item>
    </Select.List>
  </Select.Popover>
</Select.Root>
