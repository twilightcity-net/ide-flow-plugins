package org.dreamscale.flow.activity

import com.dreamscale.htmflow.api.activity.NewEditorActivity
import com.dreamscale.htmflow.api.batch.NewBatchEvent
import spock.lang.Specification

import java.time.LocalDateTime

class TestJSONConverter extends Specification {

    JSONConverter converter = new JSONConverter()

    def "toJSON/fromJSON SHOULD serialize/deserialize API types"() {
        given:
        NewEditorActivity editorActivity = NewEditorActivity.builder()
                .endTime(LocalDateTime.now())
                .durationInSeconds(5)
                .filePath("hello.txt")
                .isModified(true)
                .build()

        when:
        String json = converter.toJSON(editorActivity)
        NewEditorActivity deserializedActivity = (NewEditorActivity) converter.fromJSON(json)

        then:
        assert deserializedActivity != null
    }

    def "fromJSON SHOULD not explode if = sign in comments"() {
        given:
        NewBatchEvent event = NewBatchEvent.builder()
                .comment("This is a comment about an == sign that I screwed up")
                .build()

        when:
        String json = converter.toJSON(event)
        NewBatchEvent deserializedEvent = (NewBatchEvent) converter.fromJSON(json)

        then:
        assert deserializedEvent != null
    }

    def "toJSON SHOULD not explode if serialization type is not in the type map"() {
        given:
        Object o = new Object()

        when:
        converter.toJSON(o)

        then:
        thrown(JSONConverter.UnsupportedObjectType.class)
    }


}