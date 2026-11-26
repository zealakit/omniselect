<script lang="ts">
  import Host from "./engine-host.svelte";
  import Trigger from "./engine-trigger.svelte";
  import Content from "./engine-content.svelte";
  import { Select } from "../../dist/select/index.js";
</script>

<Host modal>
  <Trigger data-testid="dialog-trigger">Open dialog</Trigger>
  <Content data-testid="dialog-content">
    <Host>
      <Trigger data-testid="popover-trigger">Open popover</Trigger>
      <Content data-testid="popover-content">
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
      </Content>
    </Host>
  </Content>
</Host>
